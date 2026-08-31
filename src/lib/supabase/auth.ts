import 'server-only';

import { cache } from 'react';

import type { AppIdentity, AuthenticatedAppIdentity, GuestIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { USER_ROLE } from '@/constants/role';
import { createClient } from '@/lib/supabase/server';
import { getOrCreatePermanentUserRole } from '@/server/roles';

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});

export const getCurrentIdentity = cache(async function getCurrentIdentity(): Promise<AppIdentity> {
  const user = await getCurrentUser();

  if (!user) {
    return { email: null, kind: IDENTITY_KIND.PUBLIC, userId: null };
  }

  if (user.is_anonymous) {
    return {
      email: null,
      kind: IDENTITY_KIND.GUEST,
      userId: user.id,
    };
  }

  const role = await getOrCreatePermanentUserRole(user.id);

  return {
    email: user.email ?? null,
    kind: role === USER_ROLE.ADMIN ? IDENTITY_KIND.ADMIN : IDENTITY_KIND.MEMBER,
    userId: user.id,
  };
});

/**
 * Starts a guest session only when no Supabase user exists. Call this from a
 * Server Action or Route Handler so the Supabase auth cookies can be written.
 */
export async function startOrResumeGuestSession(): Promise<AuthenticatedAppIdentity> {
  const currentIdentity = await getCurrentIdentity();

  if (currentIdentity.kind !== IDENTITY_KIND.PUBLIC) {
    return currentIdentity;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    throw new Error('Unable to start guest session', { cause: error });
  }

  const guestIdentity: GuestIdentity = {
    email: null,
    kind: IDENTITY_KIND.GUEST,
    userId: data.user.id,
  };

  return guestIdentity;
}
