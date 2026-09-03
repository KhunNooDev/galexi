import 'server-only';

import { Elysia } from 'elysia';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZES } from '@/constants/pagination';
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
import { API_ERROR_CODE } from '@/server/api/error-codes';
import { isUniqueConstraintViolation } from '@/server/api/errors';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import { badRequest, conflict, created, notFound, ok } from '@/server/api/response';
import { idParamSchema } from '@/server/api/validation';

const wordApiInputSchema = wordInputSchema.extend({
  imageUrl: optionalWordImageReferenceSchema,
});
const wordListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .refine((value) => ADMIN_PAGE_SIZES.includes(value as (typeof ADMIN_PAGE_SIZES)[number]))
    .default(ADMIN_PAGE_SIZE),
  query: z.string().max(200).default(''),
  categoryId: z.coerce.number().int().positive().optional(),
  partOfSpeech: z.string().max(80).default(''),
  sort: z.enum(['default', 'word-ascending', 'word-descending']).default('default'),
});

function handleWordError(error: unknown) {
  if (
    isUniqueConstraintViolation(error, 'words_word_unique') ||
    isUniqueConstraintViolation(error, 'word_senses_word_part_order_unique')
  ) {
    return conflict(API_ERROR_CODE.WORD_SENSE_ALREADY_EXISTS, 'Word sense already exists');
  }

  throw error;
}

export const wordRoutes = new Elysia({ name: 'word-routes' })
  .use(requireAdmin)
  // Read
  .get(
    API_PATH.WORDS,
    async ({ query }) => {
      const page = await listWords({ ...query, categoryId: query.categoryId ?? null });

      return ok(page);
    },
    { query: wordListQuerySchema },
  )
  .get(
    API_PATH.WORD_BY_ID,
    async ({ params }) => {
      const word = await getWordById(params.id);

      if (!word) {
        return notFound(API_ERROR_CODE.WORD_NOT_FOUND, 'Word not found');
      }

      return ok({ word });
    },
    {
      params: idParamSchema,
    },
  )
  // Create
  .post(
    API_PATH.WORDS,
    async ({ adminUserId, body }) => {
      if (!(await categoriesExist(body.categoryIds))) {
        return badRequest(API_ERROR_CODE.INVALID_CATEGORY, 'One or more categories do not exist');
      }

      try {
        const word = await createWord(adminUserId, body);

        return created({ word });
      } catch (error) {
        return handleWordError(error);
      }
    },
    {
      body: wordApiInputSchema,
    },
  )
  // Update
  .patch(
    API_PATH.WORD_BY_ID,
    async ({ adminUserId, body, params }) => {
      const previousWord = await getWordById(params.id);

      if (!previousWord) {
        return notFound(API_ERROR_CODE.WORD_NOT_FOUND, 'Word not found');
      }

      if (!(await categoriesExist(body.categoryIds))) {
        return badRequest(API_ERROR_CODE.INVALID_CATEGORY, 'One or more categories do not exist');
      }

      try {
        const word = await updateWord(params.id, adminUserId, body);

        if (!word) {
          return notFound(API_ERROR_CODE.WORD_NOT_FOUND, 'Word not found');
        }

        if (previousWord.imageUrl && previousWord.imageUrl !== body.imageUrl) {
          try {
            await cleanupUnreferencedWordImage(previousWord.imageUrl);
          } catch (error) {
            // Database mutation already committed; cleanup failure must not fail it.
            console.error('Unable to remove the replaced word image', error);
          }
        }

        return ok({ word });
      } catch (error) {
        return handleWordError(error);
      }
    },
    {
      body: wordApiInputSchema,
      params: idParamSchema,
    },
  )
  // Delete
  .delete(
    API_PATH.WORD_BY_ID,
    async ({ params }) => {
      const word = await getWordById(params.id);

      if (!word) {
        return notFound(API_ERROR_CODE.WORD_NOT_FOUND, 'Word not found');
      }

      const deletedWord = await deleteWord(params.id);

      if (!deletedWord) {
        return notFound(API_ERROR_CODE.WORD_NOT_FOUND, 'Word not found');
      }

      if (word.imageUrl) {
        try {
          await cleanupUnreferencedWordImage(word.imageUrl);
        } catch (error) {
          // Database mutation already committed; cleanup failure must not fail it.
          console.error('Unable to remove the deleted word image', error);
        }
      }

      return ok(deletedWord);
    },
    {
      params: idParamSchema,
    },
  );
