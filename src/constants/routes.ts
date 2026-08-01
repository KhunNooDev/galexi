import { AUTH_MODE } from './auth';

export const ROUTES = {
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  HOME: '/',
  PROFILE: '/profile',
  WORDS: '/words',
  SEARCH_WORDS: '/words/search',
} as const;

export function getWordRoute(id: number) {
  return `${ROUTES.WORDS}/${id}`;
}

export function getWordImageRoute(id: number) {
  return `/api/word-images/${id}`;
}

export function getSearchWordRoute(word: string) {
  return `${ROUTES.SEARCH_WORDS}/${encodeURIComponent(word)}`;
}

export function decodeWordRouteParam(word: string) {
  try {
    return decodeURIComponent(word);
  } catch {
    return word;
  }
}

export const AUTH_ROUTES = {
  SIGN_IN: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_IN}`,
  SIGN_UP: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_UP}`,
} as const;
