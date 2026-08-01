import { zValidator } from '@hono/zod-validator';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { USER_ROLE } from '@/constants/role';
import { getStoredWordImagePath, WORD_LIMITS } from '@/constants/word';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';
import { getWordImageUrl, removeWordImage } from '@/server/word-images';

import { createWord, deleteWord, getWordById, listWords, updateWord } from './words';

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
});

const wordIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type ApiEnvironment = {
  Variables: {
    userId: string;
  };
};

const requireAdmin: MiddlewareHandler<ApiEnvironment> = async (context, next) => {
  const userId = await getCurrentUserId();

  if (!userId) {
    return context.json({ error: 'Unauthorized' }, 401);
  }

  if ((await getUserRole(userId)) !== USER_ROLE.ADMIN) {
    return context.json({ error: 'Forbidden' }, 403);
  }

  context.set('userId', userId);
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
  .use(API_PATH.WORDS, requireAdmin)
  .use(API_PATH.WORDS_WILDCARD, requireAdmin)
  .get(API_PATH.WORDS, async (context) => {
    const wordList = await listWords();

    return context.json({ words: wordList }, 200);
  })
  .post(API_PATH.WORDS, zValidator('json', wordInputSchema), async (context) => {
    const userId = context.get('userId');
    const word = await createWord(userId, context.req.valid('json'));

    return context.json({ word }, 201);
  })
  .patch(
    API_PATH.WORD_BY_ID,
    zValidator('param', wordIdSchema),
    zValidator('json', wordInputSchema),
    async (context) => {
      const { id } = context.req.valid('param');
      const previousWord = await getWordById(id);

      if (!previousWord) {
        return context.json({ error: 'Word not found' }, 404);
      }

      const values = context.req.valid('json');
      const word = await updateWord(id, values);

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
      return context.json({ error: 'Word already exists' }, 409);
    }

    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

export type ApiType = typeof api;
