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

type ProfileUpdateInput = Pick<Profile, 'avatarUrl' | 'displayName'>;

export async function getProfile(identity: PermanentIdentity) {
  const [profile] = await getDatabase()
    .select(profileColumns)
    .from(profiles)
    .where(eq(profiles.userId, identity.userId))
    .limit(1);

  if (!profile) {
    throw new Error('Unable to load profile');
  }

  return profile;
}

export async function ensureProfile(identity: PermanentIdentity) {
  const { userId } = identity;

  await getDatabase()
    .insert(profiles)
    .values({ userId })
    .onConflictDoNothing({ target: profiles.userId });

  return getProfile(identity);
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
