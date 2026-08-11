import type { InferRequestType, InferResponseType } from 'hono/client';

import { apiClient } from '@/lib/api/client';
import { throwApiError } from '@/lib/api/errors';

const wordsRoute = apiClient.api.words;
const wordRoute = wordsRoute[':id'];
const wordImageCleanupRoute = apiClient.api['word-images'].cleanup;

type WordsResponse = InferResponseType<typeof wordsRoute.$get, 200>;

export type AdminWord = WordsResponse['words'][number];
export type WordInput = InferRequestType<typeof wordsRoute.$post>['json'];
export type UpdateWordInput = {
  id: number;
  values: WordInput;
};

export const wordsApi = {
  async list(signal?: AbortSignal) {
    const response = await wordsRoute.$get(undefined, { init: { signal } });

    if (response.status !== 200) {
      return throwApiError(response);
    }

    const data = await response.json();
    return data.words;
  },

  async create(values: WordInput) {
    const response = await wordsRoute.$post({ json: values });

    if (response.status !== 201) {
      return throwApiError(response);
    }

    const data = await response.json();
    return data.word;
  },

  async update({ id, values }: UpdateWordInput) {
    const response = await wordRoute.$patch({
      param: { id: String(id) },
      json: values,
    });

    if (response.status !== 200) {
      return throwApiError(response);
    }

    const data = await response.json();
    return data.word;
  },

  async remove(id: number) {
    const response = await wordRoute.$delete({ param: { id: String(id) } });

    if (response.status !== 200) {
      return throwApiError(response);
    }

    return response.json();
  },
};

export const wordImagesApi = {
  async cleanup(imageUrl: string) {
    const response = await wordImageCleanupRoute.$post({ json: { imageUrl } });

    if (response.status !== 200) {
      return throwApiError(response);
    }

    return response.json();
  },
};
