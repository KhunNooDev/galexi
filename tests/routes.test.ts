import { describe, expect, it } from 'bun:test';

import { getPublicWordRoute, getSafeAuthReturnTo, getWordSearchReturnTo } from '@/constants/routes';

describe('safe authentication return routes', () => {
  it('allows only supported internal application routes', () => {
    expect(getSafeAuthReturnTo('/learn/save?step=password')).toBe('/learn/save?step=password');
    expect(getSafeAuthReturnTo('/admin/words/4')).toBe('/admin/words/4');
  });

  it('rejects open redirects and unsupported paths', () => {
    expect(getSafeAuthReturnTo('https://example.com')).toBeNull();
    expect(getSafeAuthReturnTo('//example.com')).toBeNull();
    expect(getSafeAuthReturnTo('/\\example.com')).toBeNull();
    expect(getSafeAuthReturnTo('/api/words')).toBeNull();
  });
});

describe('dictionary return context', () => {
  it('round trips English and Thai search queries and topic filters', () => {
    for (const source of [
      '/words/search?q=หนังสือ',
      '/categories/days?q=Monday&partOfSpeech=noun',
    ]) {
      const route = new URL(getPublicWordRoute('book', source), 'https://galexi.local');
      expect(getWordSearchReturnTo(route.searchParams.get('returnTo')!)).toBe(
        getWordSearchReturnTo(source),
      );
    }
  });

  it('falls back to search for external or unrelated destinations', () => {
    for (const source of [
      '//evil.example',
      '/\\evil.example',
      'https://evil.example',
      '/admin/words',
      '/words/search/book',
      '/categories/days/extra',
      undefined,
    ]) {
      expect(getWordSearchReturnTo(source)).toBe('/words/search');
    }
  });
});
