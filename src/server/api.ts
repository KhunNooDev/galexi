import { zValidator } from '@hono/zod-validator';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { USER_ROLE } from '@/constants/role';
import { getStoredWordImagePath, WORD_LIMITS } from '@/constants/word';
import { getCurrentUserId } from '@/lib/supabase/auth';
import {
  categoriesExist,
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  updateCategory,
} from '@/server/categories';
import { getUserRole } from '@/server/roles';
import { getWordImageUrl, removeWordImage } from '@/server/word-images';
import { createWord, deleteWord, getWordById, listWords, updateWord } from '@/server/words';

const optionalText = (maxLength: number) => z.string().trim().max(maxLength).default('');

function isValidImageReference(value: string) {
  if (!value) {
    return true;
  }

  const path = getStoredWordImagePath(value);

  return Boolean(path && /^words\/[0-9a-f-]+\.(avif|gif|jpe?g|png|webp)$/i.test(path));
}

const wordInputSchema = z.object({
  word: z.string().trim().min(1).max(WORD_LIMITS.WORD_MAX_LENGTH),
  pronunciationIpa: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH),
  pronunciationThai: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH),
  partOfSpeech: optionalText(WORD_LIMITS.PART_OF_SPEECH_MAX_LENGTH),
  meaningsTh: z
    .array(z.string().trim().min(1).max(WORD_LIMITS.MEANING_MAX_LENGTH))
    .min(1)
    .max(WORD_LIMITS.MEANINGS_MAX_COUNT),
  exampleSentence: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH),
  exampleSentenceMeaningTh: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH),
  imageUrl: optionalText(WORD_LIMITS.IMAGE_URL_MAX_LENGTH).refine(isValidImageReference),
  isPublic: z.boolean().default(false),
  categoryIds: z
    .array(z.number().int().positive())
    .max(20)
    .default([])
    .refine((ids) => new Set(ids).size === ids.length),
});

const wordIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sortOrder: z.number().int().min(0).max(10000),
});

const categoryIdSchema = z.object({ id: z.coerce.number().int().positive() });
const categoryOrderSchema = z.object({
  categoryIds: z
    .array(z.number().int().positive())
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length),
});

type ApiEnvironment = {
  Variables: {
    adminUserId: string;
  };
};

const requireAdmin: MiddlewareHandler<ApiEnvironment> = async (context, next) => {
  const adminUserId = await getCurrentUserId();

  if (!adminUserId) {
    return context.json({ error: 'Unauthorized' }, 401);
  }

  if ((await getUserRole(adminUserId)) !== USER_ROLE.ADMIN) {
    return context.json({ error: 'Forbidden' }, 403);
  }

  context.set('adminUserId', adminUserId);
  await next();
};

export const api = new Hono<ApiEnvironment>()
  .basePath(API_PATH.BASE)
  .get(API_PATH.WORD_IMAGE_BY_ID, zValidator('param', wordIdSchema), async (context) => {
    const { id } = context.req.valid('param');
    const word = await getWordById(id);

    if (!word?.imageUrl) {
      return context.notFound();
    }

    if (!word.isPublic) {
      const userId = await getCurrentUserId();

      if (!userId || (await getUserRole(userId)) !== USER_ROLE.ADMIN) {
        return context.notFound();
      }
    }

    const imageUrl = await getWordImageUrl(word.imageUrl);

    return imageUrl ? context.redirect(imageUrl, 307) : context.notFound();
  })
  .use(API_PATH.CATEGORIES, requireAdmin)
  .use(API_PATH.CATEGORIES_WILDCARD, requireAdmin)
  .get(API_PATH.CATEGORIES, async (context) =>
    context.json({ categories: await listCategories() }, 200),
  )
  .post(API_PATH.CATEGORIES, zValidator('json', categoryInputSchema), async (context) =>
    context.json({ category: await createCategory(context.req.valid('json')) }, 201),
  )
  .patch(API_PATH.CATEGORIES_REORDER, zValidator('json', categoryOrderSchema), async (context) =>
    context.json(
      { categories: await reorderCategories(context.req.valid('json').categoryIds) },
      200,
    ),
  )
  .patch(
    API_PATH.CATEGORY_BY_ID,
    zValidator('param', categoryIdSchema),
    zValidator('json', categoryInputSchema),
    async (context) => {
      const category = await updateCategory(
        context.req.valid('param').id,
        context.req.valid('json'),
      );
      return category
        ? context.json({ category }, 200)
        : context.json({ error: 'Category not found' }, 404);
    },
  )
  .delete(API_PATH.CATEGORY_BY_ID, zValidator('param', categoryIdSchema), async (context) => {
    const category = await deleteCategory(context.req.valid('param').id);
    return category
      ? context.json(category, 200)
      : context.json({ error: 'Category not found' }, 404);
  })
  .use(API_PATH.WORDS, requireAdmin)
  .use(API_PATH.WORDS_WILDCARD, requireAdmin)
  .get(API_PATH.WORDS, async (context) => {
    const wordList = await listWords();

    return context.json({ words: wordList }, 200);
  })
  .get(API_PATH.WORD_BY_ID, zValidator('param', wordIdSchema), async (context) => {
    const { id } = context.req.valid('param');
    const word = await getWordById(id);

    return word ? context.json({ word }, 200) : context.json({ error: 'Word not found' }, 404);
  })
  .post(API_PATH.WORDS, zValidator('json', wordInputSchema), async (context) => {
    const adminUserId = context.get('adminUserId');
    const values = context.req.valid('json');

    if (!(await categoriesExist(values.categoryIds))) {
      return context.json({ error: 'One or more categories do not exist' }, 400);
    }

    const word = await createWord(adminUserId, values);

    return context.json({ word }, 201);
  })
  .patch(
    API_PATH.WORD_BY_ID,
    zValidator('param', wordIdSchema),
    zValidator('json', wordInputSchema),
    async (context) => {
      const { id } = context.req.valid('param');
      const adminUserId = context.get('adminUserId');
      const previousWord = await getWordById(id);

      if (!previousWord) {
        return context.json({ error: 'Word not found' }, 404);
      }

      const values = context.req.valid('json');

      if (!(await categoriesExist(values.categoryIds))) {
        return context.json({ error: 'One or more categories do not exist' }, 400);
      }
      const word = await updateWord(id, adminUserId, values);

      if (!word) {
        return context.json({ error: 'Word not found' }, 404);
      }

      if (previousWord.imageUrl && previousWord.imageUrl !== values.imageUrl) {
        try {
          await removeWordImage(previousWord.imageUrl);
        } catch (error) {
          console.error('Unable to remove the replaced word image', error);
        }
      }

      return context.json({ word }, 200);
    },
  )
  .delete(API_PATH.WORD_BY_ID, zValidator('param', wordIdSchema), async (context) => {
    const { id } = context.req.valid('param');
    const word = await getWordById(id);

    if (!word) {
      return context.json({ error: 'Word not found' }, 404);
    }

    const deletedWord = await deleteWord(id);

    if (!deletedWord) {
      return context.json({ error: 'Word not found' }, 404);
    }

    if (word.imageUrl) {
      try {
        await removeWordImage(word.imageUrl);
      } catch (error) {
        console.error('Unable to remove the deleted word image', error);
      }
    }

    return context.json(deletedWord, 200);
  })
  .onError((error, context) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      const constraint = 'constraint' in error ? error.constraint : undefined;
      return context.json(
        {
          error:
            constraint === 'categories_slug_unique'
              ? 'Category slug already exists'
              : 'Word already exists',
        },
        409,
      );
    }

    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

export type ApiType = typeof api;
