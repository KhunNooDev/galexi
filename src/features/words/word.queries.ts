'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { wordKeys } from '@/features/words/word.keys';
import { type AdminWord, type UpdateWordInput, type WordInput, wordsApi } from '@/lib/api/words';

export function useWords(initialData: AdminWord[]) {
  return useQuery({
    queryKey: wordKeys.admin(),
    queryFn: ({ signal }) => wordsApi.list(signal),
    initialData,
    staleTime: 30_000,
  });
}

export function useCreateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: WordInput) => wordsApi.create(values),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: (createdWord) => {
      queryClient.setQueryData<AdminWord[]>(wordKeys.admin(), (current = []) => [
        createdWord,
        ...current,
      ]);
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWordInput) => wordsApi.update(input),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: (updatedWord) => {
      queryClient.setQueryData<AdminWord[]>(wordKeys.admin(), (current = []) =>
        current.map((word) => (word.id === updatedWord.id ? updatedWord : word)),
      );

      const detailKey = wordKeys.detail(updatedWord.id);

      if (queryClient.getQueryState(detailKey)) {
        queryClient.setQueryData(detailKey, updatedWord);
      }
    },
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wordsApi.remove(id),
    onMutate: () => queryClient.cancelQueries({ queryKey: wordKeys.admin() }),
    onSuccess: ({ id }) => {
      queryClient.setQueryData<AdminWord[]>(wordKeys.admin(), (current = []) =>
        current.filter((word) => word.id !== id),
      );
      queryClient.removeQueries({ queryKey: wordKeys.detail(id) });
    },
  });
}
