import type { Treaty } from '@elysiajs/eden';

import type { WordInput as DomainWordInput } from '@/features/words/word.schema';
import type { WordListParams } from '@/features/words/word-list';
import { apiClient } from '@/lib/api/client';
import { throwApiError } from '@/lib/api/errors';

const wordsRoute = apiClient.api.words;
const wordImageCleanupRoute = apiClient.api['word-images'].cleanup;

type WordsResponse = Treaty.Data<typeof wordsRoute.get>;

export type AdminWord = WordsResponse['data']['words'][number];
export type AdminWordPage = WordsResponse['data'];
export type WordInput = DomainWordInput;
export type UpdateWordInput = {
  id: number;
  values: WordInput;
};

export const wordsApi = {
  async list(params: WordListParams, signal?: AbortSignal) {
    const { data, error } = await wordsRoute.get({
      fetch: { signal },
      query: {
        ...params,
        categoryId: params.categoryId ?? undefined,
      },
    });

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },

  async create(values: WordInput) {
    const { data, error } = await wordsRoute.post(values);

    if (error) {
      return throwApiError(error);
    }

    return data.data.word;
  },

  async update({ id, values }: UpdateWordInput) {
    const { data, error } = await wordsRoute({ id }).patch(values);

    if (error) {
      return throwApiError(error);
    }

    return data.data.word;
  },

  async remove(id: number) {
    const { data, error } = await wordsRoute({ id }).delete();

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },
};

export const wordImagesApi = {
  async cleanup(imageUrl: string) {
    const { data, error } = await wordImageCleanupRoute.post({ imageUrl });

    if (error) {
      return throwApiError(error);
    }

    return data.data;
  },
};
