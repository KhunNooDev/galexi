import 'server-only';

import { eq } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningProfiles } from '@/db/schema';
import { learningProfileUpdateSchema } from '@/features/learning/learning.schema';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';

const learningProfileColumns = {
  createdAt: learningProfiles.createdAt,
  goal: learningProfiles.goal,
  level: learningProfiles.level,
  onboardingCompletedAt: learningProfiles.onboardingCompletedAt,
  updatedAt: learningProfiles.updatedAt,
};

export async function getOrCreateCurrentLearningProfile() {
  const { userId } = await requireLearningIdentity();
  const database = getDatabase();

  await database
    .insert(learningProfiles)
    .values({ userId })
    .onConflictDoNothing({ target: learningProfiles.userId });

  const [profile] = await database
    .select(learningProfileColumns)
    .from(learningProfiles)
    .where(eq(learningProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error('Unable to load learning profile');
  }

  return profile;
}

export async function updateCurrentLearningProfile(input: unknown) {
  const { userId } = await requireLearningIdentity();
  const values = learningProfileUpdateSchema.parse(input);
  const [profile] = await getDatabase()
    .insert(learningProfiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: learningProfiles.userId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning(learningProfileColumns);

  if (!profile) {
    throw new Error('Unable to update learning profile');
  }

  return profile;
}
