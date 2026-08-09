import type { InferRequestType, InferResponseType } from 'hono/client';

import { apiClient } from '@/lib/api/client';
import { throwApiError } from '@/lib/api/errors';

const categoriesRoute = apiClient.api.categories;
const categoryRoute = categoriesRoute[':id'];

type CategoriesResponse = InferResponseType<typeof categoriesRoute.$get, 200>;

export type AdminCategory = CategoriesResponse['categories'][number];
export type CategoryInput = InferRequestType<typeof categoriesRoute.$post>['json'];

export const categoriesApi = {
  async list(signal?: AbortSignal) {
    const response = await categoriesRoute.$get(undefined, { init: { signal } });
    if (response.status !== 200) return throwApiError(response);
    return (await response.json()).categories;
  },
  async create(values: CategoryInput) {
    const response = await categoriesRoute.$post({ json: values });
    if (response.status !== 201) return throwApiError(response);
    return (await response.json()).category;
  },
  async update(id: number, values: CategoryInput) {
    const response = await categoryRoute.$patch({ param: { id: String(id) }, json: values });
    if (response.status !== 200) return throwApiError(response);
    return (await response.json()).category;
  },
  async remove(id: number) {
    const response = await categoryRoute.$delete({ param: { id: String(id) } });
    if (response.status !== 200) return throwApiError(response);
    return response.json();
  },
  async reorder(categoryIds: number[]) {
    const response = await categoriesRoute.reorder.$patch({ json: { categoryIds } });
    if (response.status !== 200) return throwApiError(response);
    return (await response.json()).categories;
  },
};
