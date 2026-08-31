import 'server-only';

import { Elysia, status } from 'elysia';
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
import { isUniqueConstraintViolation } from '@/server/api/errors';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import { idParamSchema } from '@/server/api/validation';

const categoryOrderSchema = z.object({
  categoryIds: z
    .array(z.number().int().positive())
    .max(CATEGORY_LIMITS.REORDER_MAX_COUNT)
    .refine((ids) => new Set(ids).size === ids.length),
});

function handleCategoryError(error: unknown): never | ReturnType<typeof status<409, object>> {
  if (isUniqueConstraintViolation(error, 'categories_slug_unique')) {
    return status(409, { error: 'Category slug already exists' });
  }

  throw error;
}

export const categoryRoutes = new Elysia({ name: 'category-routes' })
  .use(requireAdmin)
  .get(API_PATH.CATEGORIES, async () => ({ categories: await listCategories() }))
  .post(
    API_PATH.CATEGORIES,
    async ({ body }) => {
      try {
        return status(201, { category: await createCategory(body) });
      } catch (error) {
        return handleCategoryError(error);
      }
    },
    { body: categoryInputSchema },
  )
  .patch(
    API_PATH.CATEGORIES_REORDER,
    async ({ body }) => ({ categories: await reorderCategories(body.categoryIds) }),
    { body: categoryOrderSchema },
  )
  .patch(
    API_PATH.CATEGORY_BY_ID,
    async ({ body, params, status: reply }) => {
      try {
        const category = await updateCategory(params.id, body);

        return category ? { category } : reply(404, { error: 'Category not found' });
      } catch (error) {
        return handleCategoryError(error);
      }
    },
    { body: categoryInputSchema, params: idParamSchema },
  )
  .delete(
    API_PATH.CATEGORY_BY_ID,
    async ({ params, status: reply }) => {
      const category = await deleteCategory(params.id);

      return category ?? reply(404, { error: 'Category not found' });
    },
    { params: idParamSchema },
  );
