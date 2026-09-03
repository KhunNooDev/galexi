import { afterEach, describe, expect, it, mock } from 'bun:test';

import type { AdminWord, WordInput } from '@/features/words/word.api';
import { DEFAULT_WORD_LIST_PARAMS } from '@/features/words/word-list';

mock.module('client-only', () => ({}));

const { categoriesApi } = await import('@/features/categories/category.api');
const { wordsApi } = await import('@/features/words/word.api');
const { ApiError } = await import('@/lib/api/errors');

const originalFetch = globalThis.fetch;

function stubFetch(
  implementation: (...arguments_: Parameters<typeof fetch>) => ReturnType<typeof fetch>,
) {
  const fetchMock = Object.assign(mock(implementation), {
    preconnect: originalFetch.preconnect,
  });
  globalThis.fetch = fetchMock;
  return fetchMock;
}

const wordInput: WordInput = {
  categoryIds: [],
  exampleSentence: '',
  exampleSentenceMeaningTh: '',
  imageUrl: '',
  isPublic: false,
  meaningsTh: ['สวัสดี'],
  partOfSpeech: '',
  pronunciationIpa: '',
  pronunciationThai: '',
  word: 'hello',
};

const adminWord: AdminWord = {
  categories: [],
  exampleSentence: '',
  exampleSentenceMeaningTh: '',
  id: 1,
  imageUrl: '',
  isPublic: false,
  meaningsTh: ['สวัสดี'],
  partOfSpeech: '',
  pronunciationIpa: '',
  pronunciationThai: '',
  senseOrder: 1,
  word: 'hello',
  wordId: 1,
};

describe('Eden API client wrappers', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('preserves same-origin Word list requests and AbortSignal forwarding', async () => {
    const controller = new AbortController();
    const page = { page: 1, total: 1, words: [adminWord] };
    const fetchMock = stubFetch(async () => Response.json({ data: page }));

    await expect(wordsApi.list(DEFAULT_WORD_LIST_PARAMS, controller.signal)).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/words?page=1&pageSize=6&query=&partOfSpeech=&sort=default',
      expect.objectContaining({ method: 'GET', signal: controller.signal }),
    );
  });

  it('preserves typed Word mutation paths and payloads', async () => {
    const updatedWord = { ...adminWord, id: 7 };
    const fetchMock = stubFetch(async () => Response.json({ data: { word: updatedWord } }));

    await expect(wordsApi.update({ id: 7, values: wordInput })).resolves.toEqual(updatedWord);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/words/7',
      expect.objectContaining({ body: JSON.stringify(wordInput), method: 'PATCH' }),
    );
  });

  it('normalizes typed Eden errors into the existing ApiError abstraction', async () => {
    stubFetch(async () =>
      Response.json(
        {
          error: {
            code: 'WORD_SENSE_ALREADY_EXISTS',
            message: 'Word sense already exists',
          },
        },
        { status: 409 },
      ),
    );

    const request = wordsApi.create(wordInput);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      code: 'WORD_SENSE_ALREADY_EXISTS',
      message: 'Word sense already exists',
      status: 409,
    });
  });

  it('preserves Category move path and payload', async () => {
    const fetchMock = stubFetch(async () => Response.json({ data: {} }));

    await expect(categoriesApi.move(2, -1)).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories/reorder',
      expect.objectContaining({
        body: JSON.stringify({ categoryId: 2, direction: -1 }),
        method: 'PATCH',
      }),
    );
  });

  it('forwards Category pagination through the typed client', async () => {
    const page = { categories: [], nextSortOrder: 12, page: 2, total: 12 };
    const fetchMock = stubFetch(async () => Response.json({ data: page }));

    await expect(categoriesApi.list({ page: 2, pageSize: 6, query: 'day' })).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories?page=2&pageSize=6&query=day',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
