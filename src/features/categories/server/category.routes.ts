import 'server-only';

import { Elysia } from 'elysia';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZES } from '@/constants/pagination';
import { categoryInputSchema } from '@/features/categories/category.schema';
import {
  createCategory,
  deleteCategory,
  listCategoryPage,
  moveCategory,
  updateCategory,
} from '@/features/categories/server/category.service';
import { API_ERROR_CODE } from '@/server/api/error-codes';
import { isUniqueConstraintViolation } from '@/server/api/errors';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import { conflict, created, notFound, ok } from '@/server/api/response';
import { idParamSchema } from '@/server/api/validation';

const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .refine((value) => ADMIN_PAGE_SIZES.includes(value as (typeof ADMIN_PAGE_SIZES)[number]))
    .default(ADMIN_PAGE_SIZE),
  query: z.string().max(200).default(''),
});
const categoryMoveSchema = z.object({
  categoryId: z.number().int().positive(),
  direction: z.union([z.literal(-1), z.literal(1)]),
});

function handleCategoryError(error: unknown) {
  if (isUniqueConstraintViolation(error, 'categories_slug_unique')) {
    return conflict(API_ERROR_CODE.CATEGORY_SLUG_ALREADY_EXISTS, 'Category slug already exists');
  }

  throw error;
}

export const categoryRoutes = new Elysia({ name: 'category-routes' })
  .use(requireAdmin)
  // Read
  .get(
    API_PATH.CATEGORIES,
    async ({ query }) => {
      const page = await listCategoryPage(query);

      return ok(page);
    },
    { query: categoryListQuerySchema },
  )
  // Create
  .post(
    API_PATH.CATEGORIES,
    async ({ body }) => {
      try {
        const category = await createCategory(body);

        return created({ category });
      } catch (error) {
        return handleCategoryError(error);
      }
    },
    {
      body: categoryInputSchema,
    },
  )
  // Reorder
  .patch(
    API_PATH.CATEGORIES_REORDER,
    async ({ body }) => {
      const moved = await moveCategory(body.categoryId, body.direction);

      if (!moved) {
        return notFound(API_ERROR_CODE.CATEGORY_NOT_FOUND, 'Category not found');
      }

      return ok({});
    },
    {
      body: categoryMoveSchema,
    },
  )
  // Update
  .patch(
    API_PATH.CATEGORY_BY_ID,
    async ({ body, params }) => {
      try {
        const category = await updateCategory(params.id, body);

        if (!category) {
          return notFound(API_ERROR_CODE.CATEGORY_NOT_FOUND, 'Category not found');
        }

        return ok({ category });
      } catch (error) {
        return handleCategoryError(error);
      }
    },
    {
      body: categoryInputSchema,
      params: idParamSchema,
    },
  )
  // Delete
  .delete(
    API_PATH.CATEGORY_BY_ID,
    async ({ params }) => {
      const category = await deleteCategory(params.id);

      if (!category) {
        return notFound(API_ERROR_CODE.CATEGORY_NOT_FOUND, 'Category not found');
      }

      return ok(category);
    },
    {
      params: idParamSchema,
    },
  );
