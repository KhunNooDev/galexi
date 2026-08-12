import 'server-only';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
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
import type { ApiEnvironment } from '@/server/api/types';
import { idParamSchema } from '@/server/api/validation';

const categoryOrderSchema = z.object({
  categoryIds: z
    .array(z.number().int().positive())
    .max(CATEGORY_LIMITS.REORDER_MAX_COUNT)
    .refine((ids) => new Set(ids).size === ids.length),
});

export const categoryRoutes = new Hono<ApiEnvironment>()
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
    zValidator('param', idParamSchema),
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
  .delete(API_PATH.CATEGORY_BY_ID, zValidator('param', idParamSchema), async (context) => {
    const category = await deleteCategory(context.req.valid('param').id);

    return category
      ? context.json(category, 200)
      : context.json({ error: 'Category not found' }, 404);
  })
  .onError((error, context) => {
    if (isUniqueConstraintViolation(error, 'categories_slug_unique')) {
      return context.json({ error: 'Category slug already exists' }, 409);
    }

    throw error;
  });
