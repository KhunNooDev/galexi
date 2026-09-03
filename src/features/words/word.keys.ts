import type { WordListParams } from '@/features/words/word-list';

export const wordKeys = {
  all: ['words'] as const,
  admin: () => [...wordKeys.all, 'admin'] as const,
  adminPage: (params: WordListParams) => [...wordKeys.admin(), params] as const,
};
