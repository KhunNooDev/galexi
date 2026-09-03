'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type AdminCategoryPage,
  categoriesApi,
  type CategoryInput,
} from '@/features/categories/category.api';
import { categoryKeys } from '@/features/categories/category.keys';
import {
  type CategoryListParams,
  DEFAULT_CATEGORY_LIST_PARAMS,
} from '@/features/categories/category-list';

export function useCategories(initialData: AdminCategoryPage, params: CategoryListParams) {
  const isInitialPage = Object.entries(DEFAULT_CATEGORY_LIST_PARAMS).every(
    ([key, value]) => params[key as keyof CategoryListParams] === value,
  );

  return useQuery({
    queryKey: categoryKeys.adminPage(params),
    queryFn: ({ signal }) => categoriesApi.list(params, signal),
    initialData: isInitialPage ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryInput) => categoriesApi.create(values),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.admin() }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: CategoryInput }) =>
      categoriesApi.update(id, values),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.admin() }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.admin() }),
  });
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: -1 | 1 }) =>
      categoriesApi.move(id, direction),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: categoryKeys.admin() }),
  });
}
