import type { Treaty } from '@elysiajs/eden';

import type { CategoryInput as DomainCategoryInput } from '@/features/categories/category.schema';
import type { CategoryListParams } from '@/features/categories/category-list';
import { apiClient } from '@/lib/api/client';
import { throwApiError } from '@/lib/api/errors';

const categoriesRoute = apiClient.api.categories;

type CategoriesResponse = Treaty.Data<typeof categoriesRoute.get>;

export type AdminCategory = CategoriesResponse['data']['categories'][number];
export type AdminCategoryPage = CategoriesResponse['data'];
export type CategoryInput = DomainCategoryInput;

export const categoriesApi = {
  async list(params: CategoryListParams, signal?: AbortSignal) {
    const { data, error } = await categoriesRoute.get({ fetch: { signal }, query: params });

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },

  async create(values: CategoryInput) {
    const { data, error } = await categoriesRoute.post(values);

    if (error) {
      return throwApiError(error);
    }

    return data.data.category;
  },

  async update(id: number, values: CategoryInput) {
    const { data, error } = await categoriesRoute({ id }).patch(values);

    if (error) {
      return throwApiError(error);
    }

    return data.data.category;
  },

  async remove(id: number) {
    const { data, error } = await categoriesRoute({ id }).delete();

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },

  async move(categoryId: number, direction: -1 | 1) {
    const { data, error } = await categoriesRoute.reorder.patch({ categoryId, direction });

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },
};
