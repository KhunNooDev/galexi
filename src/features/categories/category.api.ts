import type { Treaty } from '@elysiajs/eden';

import type { CategoryInput as DomainCategoryInput } from '@/features/categories/category.schema';
import { apiClient } from '@/lib/api/client';
import { throwApiError } from '@/lib/api/errors';

const categoriesRoute = apiClient.api.categories;

type CategoriesResponse = Treaty.Data<typeof categoriesRoute.get>;

export type AdminCategory = CategoriesResponse['categories'][number];
export type CategoryInput = DomainCategoryInput;

export const categoriesApi = {
  async list(signal?: AbortSignal) {
    const { data, error } = await categoriesRoute.get({ fetch: { signal } });
    if (error) return throwApiError(error);
    return data.categories;
  },
  async create(values: CategoryInput) {
    const { data, error } = await categoriesRoute.post(values);
    if (error) return throwApiError(error);
    return data.category;
  },
  async update(id: number, values: CategoryInput) {
    const { data, error } = await categoriesRoute({ id }).patch(values);
    if (error) return throwApiError(error);
    return data.category;
  },
  async remove(id: number) {
    const { data, error } = await categoriesRoute({ id }).delete();
    if (error) return throwApiError(error);
    return data;
  },
  async reorder(categoryIds: number[]) {
    const { data, error } = await categoriesRoute.reorder.patch({ categoryIds });
    if (error) return throwApiError(error);
    return data.categories;
  },
};
