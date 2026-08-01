export const AUTH_MODE = {
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
} as const;

export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];

export const AUTH_PASSWORD_MIN_LENGTH = 8;
