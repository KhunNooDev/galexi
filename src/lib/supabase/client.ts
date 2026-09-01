'use client';

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

import { publicEnv } from '@/config/env.public';
import {
  applyAuthSessionPersistence,
  shouldPersistAuthSession,
} from '@/lib/supabase/session-persistence';

export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(document.cookie);
      },
      setAll(cookiesToSet) {
        const currentCookies = parseCookieHeader(document.cookie);
        const persistentSession = shouldPersistAuthSession(currentCookies);

        applyAuthSessionPersistence(cookiesToSet, persistentSession).forEach(
          ({ name, value, options }) => {
            document.cookie = serializeCookieHeader(name, value, options);
          },
        );
      },
    },
  });
}
