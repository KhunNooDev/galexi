import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

const mocks = {
  categoriesExist: mock(),
  cleanupUnreferencedWordImage: mock(),
  createCategory: mock(),
  createWord: mock(),
  deleteCategory: mock(),
  deleteWord: mock(),
  getCurrentIdentity: mock(),
  getWordById: mock(),
  getWordImageUrl: mock(),
  listCategories: mock(),
  listWords: mock(),
  reorderCategories: mock(),
  updateCategory: mock(),
  updateWord: mock(),
};

mock.module('server-only', () => ({}));
mock.module('@/lib/supabase/auth', () => ({ getCurrentIdentity: mocks.getCurrentIdentity }));
mock.module('@/features/categories/server/category.service', () => ({
  categoriesExist: mocks.categoriesExist,
  createCategory: mocks.createCategory,
  deleteCategory: mocks.deleteCategory,
  listCategories: mocks.listCategories,
  reorderCategories: mocks.reorderCategories,
  updateCategory: mocks.updateCategory,
}));
mock.module('@/features/words/server/word.service', () => ({
  createWord: mocks.createWord,
  deleteWord: mocks.deleteWord,
  getWordById: mocks.getWordById,
  listWords: mocks.listWords,
  updateWord: mocks.updateWord,
}));
mock.module('@/features/words/server/word-image.service', () => ({
  cleanupUnreferencedWordImage: mocks.cleanupUnreferencedWordImage,
  getWordImageUrl: mocks.getWordImageUrl,
}));

const { api } = await import('@/server/api');

function apiRequest(path: string, init?: RequestInit) {
  return api.fetch(new Request(`http://localhost${path}`, init));
}

describe('Elysia API boundary', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mockFunction) => mockFunction.mockClear());
    mocks.categoriesExist.mockResolvedValue(true);
    mocks.getCurrentIdentity.mockResolvedValue({ email: null, kind: 'public', userId: null });
  });

  it('preserves unauthenticated authorization before body validation', async () => {
    const response = await apiRequest('/api/words', {
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(mocks.createWord).not.toHaveBeenCalled();
  });

  it('preserves member authorization failures', async () => {
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'member@example.com',
      kind: 'member',
      userId: 'member-id',
    });

    const response = await apiRequest('/api/categories');

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('treats Guest identities as unauthenticated for administrator APIs', async () => {
    mocks.getCurrentIdentity.mockResolvedValue({
      email: null,
      kind: 'guest',
      userId: 'guest-id',
    });

    const response = await apiRequest('/api/words');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(mocks.listWords).not.toHaveBeenCalled();
  });

  it('passes the server-resolved administrator ID into Word creation', async () => {
    const createdWord = { id: 7, word: 'hello' };
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.createWord.mockResolvedValue(createdWord);

    const response = await apiRequest('/api/words', {
      body: JSON.stringify({ imageUrl: '', meaningsTh: ['สวัสดี'], word: ' hello ' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ word: createdWord });
    expect(mocks.createWord).toHaveBeenCalledWith(
      'admin-id',
      expect.objectContaining({
        categoryIds: [],
        imageUrl: '',
        isPublic: false,
        meaningsTh: ['สวัสดี'],
        word: 'hello',
      }),
    );
  });

  it('maps Zod path validation failures to HTTP 400', async () => {
    const response = await apiRequest('/api/word-images/not-a-number');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request' });
    expect(mocks.getWordById).not.toHaveBeenCalled();
  });

  it('preserves plain 404 responses for missing Word images', async () => {
    mocks.getWordById.mockResolvedValue(null);

    const response = await apiRequest('/api/word-images/1');

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe('404 Not Found');
  });

  it('maps Category uniqueness failures without leaking database details', async () => {
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.createCategory.mockRejectedValue({
      code: '23505',
      constraint_name: 'categories_slug_unique',
    });

    const response = await apiRequest('/api/categories', {
      body: JSON.stringify({ name: 'Travel', slug: 'travel', sortOrder: 0 }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'Category slug already exists' });
  });

  it('maps Word uniqueness failures to HTTP 409 without leaking database details', async () => {
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.createWord.mockRejectedValue({
      code: '23505',
      constraint_name: 'word_senses_word_part_order_unique',
    });

    const response = await apiRequest('/api/words', {
      body: JSON.stringify({ imageUrl: '', meaningsTh: ['สวัสดี'], word: 'hello' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'Word sense already exists' });
  });

  it('preserves missing Word update semantics', async () => {
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.getWordById.mockResolvedValue(null);

    const response = await apiRequest('/api/words/42', {
      body: JSON.stringify({ imageUrl: '', meaningsTh: ['สวัสดี'], word: 'hello' }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Word not found' });
    expect(mocks.updateWord).not.toHaveBeenCalled();
  });

  it('keeps committed Word deletion successful when image cleanup fails', async () => {
    const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.getWordById.mockResolvedValue({ id: 9, imageUrl: 'words/old.jpg' });
    mocks.deleteWord.mockResolvedValue({ id: 9 });
    mocks.cleanupUnreferencedWordImage.mockRejectedValue(new Error('temporary storage failure'));

    const response = await apiRequest('/api/words/9', { method: 'DELETE' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 9 });
    expect(mocks.cleanupUnreferencedWordImage).toHaveBeenCalledWith('words/old.jpg');
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to remove the deleted word image',
      expect.any(Error),
    );

    consoleError.mockRestore();
  });

  it('logs unexpected failures and returns a generic HTTP 500 response', async () => {
    const internalError = new Error('sensitive database detail');
    const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getCurrentIdentity.mockResolvedValue({
      email: 'admin@example.com',
      kind: 'admin',
      userId: 'admin-id',
    });
    mocks.listWords.mockRejectedValue(internalError);

    const response = await apiRequest('/api/words');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
    expect(consoleError).toHaveBeenCalledWith(internalError);

    consoleError.mockRestore();
  });
});
