import type { AuthMode } from '@/constants/auth';
import { AUTH_MODE } from '@/constants/auth';

export const ROUTES = {
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  CATEGORIES: '/categories',
  MANAGE_CATEGORIES: '/admin/categories',
  MANAGE_WORDS: '/admin/words',
  HOME: '/',
  LEARN_HOME: '/learn',
  LEARN_GOAL: '/learn/start/goal',
  LEARN_LEVEL: '/learn/start/level',
  LEARN_READY: '/learn/start/ready',
  LEARN_SAVE: '/learn/save',
  LEARN_START: '/learn/start',
  PROFILE: '/profile',
  PUBLIC_WORDS: '/words/search',
} as const;

export function getCategoryRoute(slug: string) {
  return `${ROUTES.CATEGORIES}/${encodeURIComponent(slug)}`;
}

export function getManageWordRoute(id: number) {
  return `${ROUTES.MANAGE_WORDS}/${id}`;
}

export function getLessonRoute(lessonKey: string) {
  return `/learn/lesson/${encodeURIComponent(lessonKey)}`;
}

export function getLessonResultRoute(lessonKey: string, sessionId: string) {
  return `${getLessonRoute(lessonKey)}/result/${encodeURIComponent(sessionId)}`;
}

const SAFE_AUTH_RETURN_PREFIXES = [
  ROUTES.CATEGORIES,
  ROUTES.LEARN_HOME,
  ROUTES.MANAGE_CATEGORIES,
  ROUTES.MANAGE_WORDS,
  ROUTES.PROFILE,
  ROUTES.PUBLIC_WORDS,
] as const;

export function getSafeAuthReturnTo(value: string | string[] | null | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return null;
  }

  try {
    const parsed = new URL(candidate, 'https://galexi.local');

    if (
      parsed.origin !== 'https://galexi.local' ||
      !SAFE_AUTH_RETURN_PREFIXES.some(
        (prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
      )
    ) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function getAuthRoute(mode: AuthMode, returnTo?: string | null) {
  const search = new URLSearchParams({ mode });

  if (returnTo) {
    search.set('next', returnTo);
  }

  return `${ROUTES.AUTH}?${search.toString()}`;
}

export function getWordImageRoute(id: number) {
  return `/api/word-images/${id}`;
}

export function getPublicWordRoute(word: string) {
  return `${ROUTES.PUBLIC_WORDS}/${encodeURIComponent(word)}`;
}

export function decodeWordRouteParam(word: string) {
  try {
    return decodeURIComponent(word);
  } catch {
    return word;
  }
}

export const AUTH_ROUTES = {
  SIGN_IN: getAuthRoute(AUTH_MODE.SIGN_IN),
} as const;
