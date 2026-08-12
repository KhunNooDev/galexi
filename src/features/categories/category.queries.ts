'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type AdminCategory,
  categoriesApi,
  type CategoryInput,
} from '@/features/categories/category.api';
import { categoryKeys } from '@/features/categories/category.keys';

function sortCategories(categories: AdminCategory[]) {
  return [...categories].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
  );
}

export function useCategories(initialData: AdminCategory[]) {
  return useQuery({
    queryKey: categoryKeys.admin(),
    queryFn: ({ signal }) => categoriesApi.list(signal),
    initialData,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryInput) => categoriesApi.create(values),
    onSuccess: (category) =>
      queryClient.setQueryData<AdminCategory[]>(categoryKeys.admin(), (current = []) =>
        sortCategories([...current, category]),
      ),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: CategoryInput }) =>
      categoriesApi.update(id, values),
    onSuccess: (category) =>
      queryClient.setQueryData<AdminCategory[]>(categoryKeys.admin(), (current = []) =>
        sortCategories(current.map((item) => (item.id === category.id ? category : item))),
      ),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: ({ id }) =>
      queryClient.setQueryData<AdminCategory[]>(categoryKeys.admin(), (current = []) =>
        current.filter((category) => category.id !== id),
      ),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => categoriesApi.reorder(ids),
    onSuccess: (categories) => queryClient.setQueryData(categoryKeys.admin(), categories),
  });
}
