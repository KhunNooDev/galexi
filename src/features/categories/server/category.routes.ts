import 'server-only';

import { Elysia } from 'elysia';
import { z } from 'zod';

import { API_PATH } from '@/constants/api';
import { CATEGORY_LIMITS } from '@/constants/category';
import { categoryInputSchema } from '@/features/categories/category.schema';
import {
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  updateCategory,
} from '@/features/categories/server/category.service';
import { API_ERROR_CODE } from '@/server/api/error-codes';
import { isUniqueConstraintViolation } from '@/server/api/errors';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import { conflict, created, notFound, ok } from '@/server/api/response';
import { idParamSchema } from '@/server/api/validation';

const categoryOrderSchema = z.object({
  categoryIds: z
    .array(z.number().int().positive())
    .max(CATEGORY_LIMITS.REORDER_MAX_COUNT)
    .refine((ids) => new Set(ids).size === ids.length),
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
  .get(API_PATH.CATEGORIES, async () => {
    const categories = await listCategories();

    return ok({ categories });
  })
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
      const categories = await reorderCategories(body.categoryIds);

      return ok({ categories });
    },
    {
      body: categoryOrderSchema,
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
