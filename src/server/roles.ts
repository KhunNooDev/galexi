import 'server-only';

import { eq } from 'drizzle-orm';

import type { UserRole } from '@/constants/role';
import { USER_ROLE } from '@/constants/role';
import { getDatabase } from '@/db';
import { userRoles } from '@/db/schema';

export async function getUserRole(userId: string): Promise<UserRole> {
  const database = getDatabase();

  const [record] = await database
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1);

  if (!record) {
    throw new Error('Unable to load user role');
  }

  return record.role;
}

export async function ensurePermanentUserRole(userId: string): Promise<UserRole> {
  await getDatabase()
    .insert(userRoles)
    .values({ userId, role: USER_ROLE.MEMBER })
    .onConflictDoNothing({ target: userRoles.userId });

  return getUserRole(userId);
}
