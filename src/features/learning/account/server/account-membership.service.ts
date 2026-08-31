import 'server-only';

import type { User } from '@supabase/supabase-js';

import type { PermanentIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { USER_ROLE } from '@/constants/role';
import { getOrCreateProfile } from '@/server/profiles';
import { getOrCreatePermanentUserRole } from '@/server/roles';

export async function establishPermanentAccount(user: User): Promise<PermanentIdentity> {
  if (user.is_anonymous) {
    throw new Error('A permanent account is required');
  }

  const role = await getOrCreatePermanentUserRole(user.id);
  const identity: PermanentIdentity = {
    email: user.email ?? null,
    kind: role === USER_ROLE.ADMIN ? IDENTITY_KIND.ADMIN : IDENTITY_KIND.MEMBER,
    userId: user.id,
  };

  await getOrCreateProfile(identity);
  return identity;
}
