import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { publicEnv } from '@/config/env.public';
import {
  applyAuthSessionPersistence,
  AUTH_SESSION_PERSISTENCE_COOKIE,
  SESSION_ONLY_AUTH_COOKIE_VALUE,
  shouldPersistAuthSession,
} from '@/lib/supabase/session-persistence';

type CreateClientOptions = {
  persistentSession?: boolean;
};

export async function createClient(options: CreateClientOptions = {}) {
  const cookieStore = await cookies();
  const persistentSession =
    options.persistentSession ?? shouldPersistAuthSession(cookieStore.getAll());

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          applyAuthSessionPersistence(cookiesToSet, persistentSession).forEach(
            ({ name, value, options }) => {
              cookieStore.set(name, value, options);
            },
          );
        } catch {
          // Server Components cannot write cookies. Proxy handles refreshes.
        }
      },
    },
  });
}

export async function setAuthSessionPersistence(persistent: boolean) {
  const cookieStore = await cookies();

  if (persistent) {
    cookieStore.delete(AUTH_SESSION_PERSISTENCE_COOKIE);
    return;
  }

  cookieStore.set(AUTH_SESSION_PERSISTENCE_COOKIE, SESSION_ONLY_AUTH_COOKIE_VALUE, {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAuthSessionPersistence() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_PERSISTENCE_COOKIE);
}
