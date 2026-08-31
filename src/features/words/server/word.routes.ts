import 'server-only';

import { Elysia, status } from 'elysia';

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
import { idParamSchema } from '@/server/api/validation';

const wordApiInputSchema = wordInputSchema.extend({
  imageUrl: optionalWordImageReferenceSchema,
});

function handleWordError(error: unknown): never | ReturnType<typeof status<409, object>> {
  if (
    isUniqueConstraintViolation(error, 'words_word_unique') ||
    isUniqueConstraintViolation(error, 'word_senses_word_part_order_unique')
  ) {
    return status(409, { error: 'Word sense already exists' });
  }

  throw error;
}

export const wordRoutes = new Elysia({ name: 'word-routes' })
  .use(requireAdmin)
  .get(API_PATH.WORDS, async () => ({ words: await listWords() }))
  .get(
    API_PATH.WORD_BY_ID,
    async ({ params, status: reply }) => {
      const word = await getWordById(params.id);

      return word ? { word } : reply(404, { error: 'Word not found' });
    },
    { params: idParamSchema },
  )
  .post(
    API_PATH.WORDS,
    async ({ adminUserId, body, status: reply }) => {
      if (!(await categoriesExist(body.categoryIds))) {
        return reply(400, { error: 'One or more categories do not exist' });
      }

      try {
        return status(201, { word: await createWord(adminUserId, body) });
      } catch (error) {
        return handleWordError(error);
      }
    },
    { body: wordApiInputSchema },
  )
  .patch(
    API_PATH.WORD_BY_ID,
    async ({ adminUserId, body, params, status: reply }) => {
      const previousWord = await getWordById(params.id);

      if (!previousWord) {
        return reply(404, { error: 'Word not found' });
      }

      if (!(await categoriesExist(body.categoryIds))) {
        return reply(400, { error: 'One or more categories do not exist' });
      }

      try {
        const word = await updateWord(params.id, adminUserId, body);

        if (!word) {
          return reply(404, { error: 'Word not found' });
        }

        if (previousWord.imageUrl && previousWord.imageUrl !== body.imageUrl) {
          try {
            await cleanupUnreferencedWordImage(previousWord.imageUrl);
          } catch (error) {
            console.error('Unable to remove the replaced word image', error);
          }
        }

        return { word };
      } catch (error) {
        return handleWordError(error);
      }
    },
    { body: wordApiInputSchema, params: idParamSchema },
  )
  .delete(
    API_PATH.WORD_BY_ID,
    async ({ params, status: reply }) => {
      const word = await getWordById(params.id);

      if (!word) {
        return reply(404, { error: 'Word not found' });
      }

      const deletedWord = await deleteWord(params.id);

      if (!deletedWord) {
        return reply(404, { error: 'Word not found' });
      }

      if (word.imageUrl) {
        try {
          await cleanupUnreferencedWordImage(word.imageUrl);
        } catch (error) {
          console.error('Unable to remove the deleted word image', error);
        }
      }

      return deletedWord;
    },
    { params: idParamSchema },
  );
