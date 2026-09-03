import { ADMIN_PAGE_SIZE } from '@/constants/pagination';

export type WordSort = 'default' | 'word-ascending' | 'word-descending';

export type WordListParams = {
  page: number;
  pageSize: number;
  query: string;
  categoryId: number | null;
  partOfSpeech: string;
  sort: WordSort;
};

export const DEFAULT_WORD_LIST_PARAMS: WordListParams = {
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
  query: '',
  categoryId: null,
  partOfSpeech: '',
  sort: 'default',
};
