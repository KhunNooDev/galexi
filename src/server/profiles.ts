import 'server-only';

import { eq } from 'drizzle-orm';

import type { PermanentIdentity } from '@/constants/identity';
import { getDatabase } from '@/db';
import type { Profile } from '@/db/schema';
import { profiles } from '@/db/schema';

const profileColumns = {
  userId: profiles.userId,
  displayName: profiles.displayName,
  avatarUrl: profiles.avatarUrl,
};

export type ProfileUpdateInput = Pick<Profile, 'avatarUrl' | 'displayName'>;

export async function getOrCreateProfile(identity: PermanentIdentity) {
  const { userId } = identity;
  const database = getDatabase();

  await database
    .insert(profiles)
    .values({ userId })
    .onConflictDoNothing({ target: profiles.userId });

  const [profile] = await database
    .select(profileColumns)
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error('Unable to load profile');
  }

  return profile;
}

export async function updateProfile(identity: PermanentIdentity, values: ProfileUpdateInput) {
  const { userId } = identity;
  const [profile] = await getDatabase()
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: values,
    })
    .returning(profileColumns);

  if (!profile) {
    throw new Error('Unable to update profile');
  }

  return profile;
}
