import 'server-only';

import { createClient } from './server';

export async function getCurrentUserClaims() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims;
}

export async function getCurrentUserId() {
  const claims = await getCurrentUserClaims();
  return claims?.sub ?? null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
