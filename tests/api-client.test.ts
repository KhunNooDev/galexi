import { afterEach, describe, expect, it, mock } from 'bun:test';

import type { AdminWord, WordInput } from '@/features/words/word.api';

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
    const words = [adminWord];
    const fetchMock = stubFetch(async () => Response.json({ words }));

    await expect(wordsApi.list(controller.signal)).resolves.toEqual(words);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/words',
      expect.objectContaining({ method: 'GET', signal: controller.signal }),
    );
  });

  it('preserves typed Word mutation paths and payloads', async () => {
    const updatedWord = { ...adminWord, id: 7 };
    const fetchMock = stubFetch(async () => Response.json({ word: updatedWord }));

    await expect(wordsApi.update({ id: 7, values: wordInput })).resolves.toEqual(updatedWord);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/words/7',
      expect.objectContaining({ body: JSON.stringify(wordInput), method: 'PATCH' }),
    );
  });

  it('normalizes typed Eden errors into the existing ApiError abstraction', async () => {
    stubFetch(async () =>
      Response.json(
        { code: 'duplicate_word', error: 'Word sense already exists' },
        { status: 409 },
      ),
    );

    const request = wordsApi.create(wordInput);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      code: 'duplicate_word',
      message: 'Word sense already exists',
      status: 409,
    });
  });

  it('preserves Category reorder path, payload, and return shape', async () => {
    const categories = [{ id: 2, name: 'Travel', slug: 'travel', sortOrder: 0, wordCount: 3 }];
    const fetchMock = stubFetch(async () => Response.json({ categories }));

    await expect(categoriesApi.reorder([2])).resolves.toEqual(categories);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories/reorder',
      expect.objectContaining({ body: JSON.stringify({ categoryIds: [2] }), method: 'PATCH' }),
    );
  });
});
