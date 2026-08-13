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
  SIGN_IN: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_IN}`,
  SIGN_UP: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_UP}`,
} as const;
