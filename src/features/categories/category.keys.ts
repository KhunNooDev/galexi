import type { CategoryListParams } from '@/features/categories/category-list';

export const categoryKeys = {
  all: ['categories'] as const,
  admin: () => [...categoryKeys.all, 'admin'] as const,
  adminPage: (params: CategoryListParams) => [...categoryKeys.admin(), params] as const,
};
