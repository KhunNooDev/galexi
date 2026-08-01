import { AUTH_MODE } from './auth';

export const ROUTES = {
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  HOME: '/',
  PROFILE: '/profile',
  TASKS: '/tasks',
} as const;

export const AUTH_ROUTES = {
  SIGN_IN: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_IN}`,
  SIGN_UP: `${ROUTES.AUTH}?mode=${AUTH_MODE.SIGN_UP}`,
} as const;
