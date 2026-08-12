import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';
import {
  createLearningSessionInputSchema,
  learningSessionIdSchema,
  updateLearningSessionInputSchema,
} from '@/features/learning/learning.schema';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';

const learningSessionColumns = {
  completedAt: learningSessions.completedAt,
  currentStep: learningSessions.currentStep,
  id: learningSessions.id,
  lessonKey: learningSessions.lessonKey,
  score: learningSessions.score,
  startedAt: learningSessions.startedAt,
  state: learningSessions.state,
  status: learningSessions.status,
  updatedAt: learningSessions.updatedAt,
};

export async function createCurrentLearningSession(input: unknown) {
  const { userId } = await requireLearningIdentity();
  const values = createLearningSessionInputSchema.parse(input);
  const [session] = await getDatabase()
    .insert(learningSessions)
    .values({ userId, ...values })
    .returning(learningSessionColumns);

  if (!session) {
    throw new Error('Unable to create learning session');
  }

  return session;
}

export async function getCurrentLearningSession(lessonKey?: string) {
  const { userId } = await requireLearningIdentity();
  const predicates = [
    eq(learningSessions.userId, userId),
    eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
  ];

  if (lessonKey !== undefined) {
    const parsedLessonKey = createLearningSessionInputSchema.shape.lessonKey.parse(lessonKey);
    predicates.push(eq(learningSessions.lessonKey, parsedLessonKey));
  }

  const [session] = await getDatabase()
    .select(learningSessionColumns)
    .from(learningSessions)
    .where(and(...predicates))
    .orderBy(desc(learningSessions.updatedAt))
    .limit(1);

  return session ?? null;
}

export async function updateCurrentLearningSession(sessionId: string, input: unknown) {
  const { userId } = await requireLearningIdentity();
  const id = learningSessionIdSchema.parse(sessionId);
  const values = updateLearningSessionInputSchema.parse(input);
  const completedAt =
    values.status === LEARNING_SESSION_STATUS.COMPLETED
      ? new Date()
      : values.status
        ? null
        : undefined;
  const [session] = await getDatabase()
    .update(learningSessions)
    .set({ ...values, completedAt })
    .where(and(eq(learningSessions.id, id), eq(learningSessions.userId, userId)))
    .returning(learningSessionColumns);

  return session ?? null;
}
