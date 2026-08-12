'use client';

import { createBrowserClient } from '@supabase/ssr';

import { publicEnv } from '@/config/env.public';

export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
}
