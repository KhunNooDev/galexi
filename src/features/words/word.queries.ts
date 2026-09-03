'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type AdminWordPage,
  type UpdateWordInput,
  type WordInput,
  wordsApi,
} from '@/features/words/word.api';
import { wordKeys } from '@/features/words/word.keys';
import { DEFAULT_WORD_LIST_PARAMS, type WordListParams } from '@/features/words/word-list';

export function useWords(initialData: AdminWordPage, params: WordListParams) {
  const isInitialPage = Object.entries(DEFAULT_WORD_LIST_PARAMS).every(
    ([key, value]) => params[key as keyof WordListParams] === value,
  );

  return useQuery({
    queryKey: wordKeys.adminPage(params),
    queryFn: ({ signal }) => wordsApi.list(params, signal),
    initialData: isInitialPage ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: WordInput) => wordsApi.create(values),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wordKeys.admin() });
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWordInput) => wordsApi.update(input),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wordKeys.admin() });
    },
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wordsApi.remove(id),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wordKeys.admin() });
    },
  });
}
