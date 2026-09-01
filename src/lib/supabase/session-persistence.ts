export const AUTH_SESSION_PERSISTENCE_COOKIE = 'galexi-auth-session';
export const SESSION_ONLY_AUTH_COOKIE_VALUE = 'session-only';

type CookieWithOptions = {
  options: {
    expires?: Date;
    maxAge?: number;
    [key: string]: unknown;
  };
};

type CookieValue = {
  name: string;
  value: string;
};

export function isSessionOnlyAuthCookie(value?: string) {
  return value === SESSION_ONLY_AUTH_COOKIE_VALUE;
}

export function shouldPersistAuthSession(cookies: CookieValue[]) {
  return !isSessionOnlyAuthCookie(
    cookies.find(({ name }) => name === AUTH_SESSION_PERSISTENCE_COOKIE)?.value,
  );
}

export function applyAuthSessionPersistence<T extends CookieWithOptions>(
  cookies: T[],
  persistent: boolean,
): T[] {
  if (persistent) return cookies;

  return cookies.map((cookie) => {
    const expires = cookie.options.expires;
    const isDeletion =
      (typeof cookie.options.maxAge === 'number' && cookie.options.maxAge <= 0) ||
      (expires instanceof Date && expires.getTime() <= Date.now());

    if (isDeletion) return cookie;

    const options = { ...cookie.options };
    delete options.expires;
    delete options.maxAge;

    return { ...cookie, options } as T;
  });
}
