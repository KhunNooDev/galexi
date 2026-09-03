import { ADMIN_PAGE_SIZE } from '@/constants/pagination';

export type CategoryListParams = {
  page: number;
  pageSize: number;
  query: string;
};

export const DEFAULT_CATEGORY_LIST_PARAMS: CategoryListParams = {
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
  query: '',
};
