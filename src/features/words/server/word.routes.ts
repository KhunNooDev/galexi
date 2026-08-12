import 'server-only';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { API_PATH } from '@/constants/api';
import { categoriesExist } from '@/features/categories/server/category.service';
import {
  createWord,
  deleteWord,
  getWordById,
  listWords,
  updateWord,
} from '@/features/words/server/word.service';
import { cleanupUnreferencedWordImage } from '@/features/words/server/word-image.service';
import { optionalWordImageReferenceSchema, wordInputSchema } from '@/features/words/word.schema';
import { isUniqueConstraintViolation } from '@/server/api/errors';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import type { ApiEnvironment } from '@/server/api/types';
import { idParamSchema } from '@/server/api/validation';

const wordApiInputSchema = wordInputSchema.extend({
  imageUrl: optionalWordImageReferenceSchema,
});

export const wordRoutes = new Hono<ApiEnvironment>()
  .use(API_PATH.WORDS_WILDCARD, requireAdmin)
  .get(API_PATH.WORDS, async (context) => {
    const wordList = await listWords();

    return context.json({ words: wordList }, 200);
  })
  .get(API_PATH.WORD_BY_ID, zValidator('param', idParamSchema), async (context) => {
    const { id } = context.req.valid('param');
    const word = await getWordById(id);

    return word ? context.json({ word }, 200) : context.json({ error: 'Word not found' }, 404);
  })
  .post(API_PATH.WORDS, zValidator('json', wordApiInputSchema), async (context) => {
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
    zValidator('param', idParamSchema),
    zValidator('json', wordApiInputSchema),
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
          await cleanupUnreferencedWordImage(previousWord.imageUrl);
        } catch (error) {
          console.error('Unable to remove the replaced word image', error);
        }
      }

      return context.json({ word }, 200);
    },
  )
  .delete(API_PATH.WORD_BY_ID, zValidator('param', idParamSchema), async (context) => {
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
        await cleanupUnreferencedWordImage(word.imageUrl);
      } catch (error) {
        console.error('Unable to remove the deleted word image', error);
      }
    }

    return context.json(deletedWord, 200);
  })
  .onError((error, context) => {
    if (isUniqueConstraintViolation(error, 'words_word_part_unique')) {
      return context.json({ error: 'Word already exists' }, 409);
    }

    throw error;
  });
