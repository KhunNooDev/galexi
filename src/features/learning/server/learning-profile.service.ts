import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';

import { ROUTES } from '@/constants/routes';
import { getDatabase } from '@/db';
import { learningProfiles } from '@/db/schema';
import {
  learningGoalInputSchema,
  learningLevelInputSchema,
} from '@/features/learning/learning.schema';
import { resolveLearningEntry } from '@/features/learning/learning-entry';
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

type CurrentLearningProfile = Awaited<ReturnType<typeof getOrCreateCurrentLearningProfile>>;

export async function saveCurrentLearningGoal(input: unknown) {
  const { userId } = await requireLearningIdentity();
  const { goal } = learningGoalInputSchema.parse(input);
  const [profile] = await getDatabase()
    .insert(learningProfiles)
    .values({ goal, userId })
    .onConflictDoUpdate({
      target: learningProfiles.userId,
      set: { goal, updatedAt: new Date() },
    })
    .returning(learningProfileColumns);

  if (!profile) {
    throw new Error('Unable to update learning profile');
  }

  return profile;
}

export async function saveCurrentLearningLevelAndComplete(input: unknown) {
  const { userId } = await requireLearningIdentity();
  const { level } = learningLevelInputSchema.parse(input);
  const database = getDatabase();

  return database.transaction(async (transaction) => {
    const [currentProfile] = await transaction
      .select({
        goal: learningProfiles.goal,
        onboardingCompletedAt: learningProfiles.onboardingCompletedAt,
      })
      .from(learningProfiles)
      .where(eq(learningProfiles.userId, userId))
      .limit(1);

    if (!currentProfile?.goal) {
      throw new Error('Learning goal required');
    }

    const now = new Date();
    const [profile] = await transaction
      .update(learningProfiles)
      .set({
        level,
        onboardingCompletedAt: currentProfile.onboardingCompletedAt ?? now,
        updatedAt: now,
      })
      .where(eq(learningProfiles.userId, userId))
      .returning(learningProfileColumns);

    if (!profile) {
      throw new Error('Unable to complete learning onboarding');
    }

    return profile;
  });
}

export async function ensureCurrentLearningOnboardingComplete(
  currentProfile?: CurrentLearningProfile,
) {
  const { userId } = await requireLearningIdentity();
  const database = getDatabase();
  const profile = currentProfile ?? (await getOrCreateCurrentLearningProfile());

  if (!profile.goal || !profile.level || profile.onboardingCompletedAt) {
    return profile;
  }

  const now = new Date();
  const [completedProfile] = await database
    .update(learningProfiles)
    .set({ onboardingCompletedAt: now, updatedAt: now })
    .where(and(eq(learningProfiles.userId, userId), isNull(learningProfiles.onboardingCompletedAt)))
    .returning(learningProfileColumns);

  return completedProfile ?? getOrCreateCurrentLearningProfile();
}

export async function getCurrentLearningEntryRoute() {
  const profile = await getOrCreateCurrentLearningProfile();
  const route = resolveLearningEntry(profile);

  if (route === ROUTES.LEARN_READY) {
    await ensureCurrentLearningOnboardingComplete(profile);
  }

  return route;
}
