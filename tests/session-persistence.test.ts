import { describe, expect, it } from 'bun:test';

import {
  applyAuthSessionPersistence,
  AUTH_SESSION_PERSISTENCE_COOKIE,
  isSessionOnlyAuthCookie,
  SESSION_ONLY_AUTH_COOKIE_VALUE,
  shouldPersistAuthSession,
} from '@/lib/supabase/session-persistence';

describe('authentication session persistence', () => {
  const persistentCookie = {
    name: 'sb-project-auth-token',
    options: {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: false,
      maxAge: 34_560_000,
      path: '/',
      sameSite: 'lax' as const,
    },
    value: 'session',
  };

  it('keeps persistent Supabase cookie lifetimes when Remember me is enabled', () => {
    expect(applyAuthSessionPersistence([persistentCookie], true)).toEqual([persistentCookie]);
  });

  it('removes persistent lifetime attributes for browser-session sign-in', () => {
    const [cookie] = applyAuthSessionPersistence([persistentCookie], false);

    expect(cookie.options).not.toHaveProperty('expires');
    expect(cookie.options).not.toHaveProperty('maxAge');
    expect(cookie.options).toMatchObject({ path: '/', sameSite: 'lax' });
  });

  it('preserves Supabase cookie deletion directives during sign-out', () => {
    const deletionCookie = {
      ...persistentCookie,
      options: { ...persistentCookie.options, maxAge: 0 },
      value: '',
    };

    expect(applyAuthSessionPersistence([deletionCookie], false)).toEqual([deletionCookie]);
  });

  it('keeps browser refresh cookies session-only when the preference marker is present', () => {
    const currentCookies = [
      {
        name: AUTH_SESSION_PERSISTENCE_COOKIE,
        value: SESSION_ONLY_AUTH_COOKIE_VALUE,
      },
    ];
    const [refreshedCookie] = applyAuthSessionPersistence(
      [persistentCookie],
      shouldPersistAuthSession(currentCookies),
    );

    expect(refreshedCookie.options).not.toHaveProperty('expires');
    expect(refreshedCookie.options).not.toHaveProperty('maxAge');
  });

  it('recognizes only the explicit session-only preference', () => {
    expect(isSessionOnlyAuthCookie(SESSION_ONLY_AUTH_COOKIE_VALUE)).toBe(true);
    expect(isSessionOnlyAuthCookie()).toBe(false);
    expect(isSessionOnlyAuthCookie('persistent')).toBe(false);
  });
});
