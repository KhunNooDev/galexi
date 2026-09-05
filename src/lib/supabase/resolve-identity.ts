import type { User } from '@supabase/supabase-js';

import type { AppIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import type { UserRole } from '@/constants/role';
import { USER_ROLE } from '@/constants/role';

type RoleLookup = (userId: string) => Promise<UserRole>;

export async function resolveAppIdentity(
  user: User | null,
  getRole: RoleLookup,
): Promise<AppIdentity> {
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

  const role = await getRole(user.id);

  return {
    email: user.email ?? null,
    kind: role === USER_ROLE.ADMIN ? IDENTITY_KIND.ADMIN : IDENTITY_KIND.MEMBER,
    userId: user.id,
  };
}
