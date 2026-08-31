import 'server-only';

import { and, desc, eq, ne, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';
import {
  advanceLessonInputSchema,
  LESSON_PHASE,
  type LessonSessionState,
  normalizeLessonSessionState,
} from '@/features/learning/lesson.schema';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import {
  lessonSessionColumns,
  type LessonTransaction,
  lockLessonSession,
} from '@/features/learning/server/lesson-session.persistence';

type LessonSessionResult = {
  id: string;
  state: LessonSessionState;
};

async function recordWordSenseExposure(
  transaction: LessonTransaction,
  userId: string,
  wordSenseId: number,
) {
  const now = new Date();

  await transaction
    .insert(userWordProgress)
    .values({ lastSeenAt: now, seenCount: 1, userId, wordSenseId })
    .onConflictDoUpdate({
      target: [userWordProgress.userId, userWordProgress.wordSenseId],
      set: {
        lastSeenAt: now,
        seenCount: sql`${userWordProgress.seenCount} + 1`,
        updatedAt: now,
      },
    });
}

async function ensureCurrentWordExposure(
  transaction: LessonTransaction,
  userId: string,
  wordSenseIds: readonly number[],
  state: LessonSessionState,
) {
  const wordSenseId = wordSenseIds[state.wordIndex];

  if (!wordSenseId || state.seenWordSenseIds.includes(wordSenseId)) {
    return state;
  }

  await recordWordSenseExposure(transaction, userId, wordSenseId);

  return { ...state, seenWordSenseIds: [...state.seenWordSenseIds, wordSenseId] };
}

export async function getOrCreateCurrentLessonSession(
  lesson: LessonDefinition,
): Promise<LessonSessionResult> {
  const { userId } = await requireLearningIdentity();

  return getDatabase().transaction(async (transaction) => {
    await lockLessonSession(transaction, userId, lesson.key);

    const [existingSession] = await transaction
      .select(lessonSessionColumns)
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.userId, userId),
          eq(learningSessions.lessonKey, lesson.key),
          eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
        ),
      )
      .orderBy(desc(learningSessions.updatedAt), desc(learningSessions.startedAt))
      .limit(1);

    let session = existingSession;

    if (!session) {
      [session] = await transaction
        .insert(learningSessions)
        .values({ lessonKey: lesson.key, state: {}, userId })
        .returning(lessonSessionColumns);
    } else {
      await transaction
        .update(learningSessions)
        .set({ status: LEARNING_SESSION_STATUS.ABANDONED })
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.lessonKey, lesson.key),
            eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
            ne(learningSessions.id, session.id),
          ),
        );
    }

    if (!session) {
      throw new Error('Unable to create lesson session');
    }

    const normalizedState = normalizeLessonSessionState(session.state, lesson.wordSenseIds);
    const state = await ensureCurrentWordExposure(
      transaction,
      userId,
      lesson.wordSenseIds,
      normalizedState,
    );
    const [updatedSession] = await transaction
      .update(learningSessions)
      .set({ state, updatedAt: new Date() })
      .where(and(eq(learningSessions.id, session.id), eq(learningSessions.userId, userId)))
      .returning(lessonSessionColumns);

    if (!updatedSession) {
      throw new Error('Unable to load lesson session');
    }

    return { ...updatedSession, state };
  });
}

export async function advanceCurrentLesson(
  lesson: LessonDefinition,
  input: unknown,
): Promise<LessonSessionResult> {
  const { userId } = await requireLearningIdentity();
  const values = advanceLessonInputSchema.parse(input);

  if (values.lessonKey !== lesson.key) {
    throw new Error('Lesson does not match the requested session');
  }

  return getDatabase().transaction(async (transaction) => {
    await lockLessonSession(transaction, userId, lesson.key);

    const [session] = await transaction
      .select(lessonSessionColumns)
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.id, values.sessionId),
          eq(learningSessions.userId, userId),
          eq(learningSessions.lessonKey, lesson.key),
          eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
        ),
      )
      .limit(1);

    if (!session) {
      throw new Error('Lesson session is unavailable');
    }

    const state = normalizeLessonSessionState(session.state, lesson.wordSenseIds);
    const authoritativeWordSenseId = lesson.wordSenseIds[state.wordIndex];

    if (
      state.phase !== LESSON_PHASE.LEARN ||
      state.wordIndex !== values.expectedWordIndex ||
      authoritativeWordSenseId !== values.expectedWordSenseId
    ) {
      return { ...session, state };
    }

    const nextWordIndex = state.wordIndex + 1;
    const nextState: LessonSessionState =
      nextWordIndex >= lesson.wordSenseIds.length
        ? { ...state, phase: LESSON_PHASE.PRACTICE }
        : { ...state, wordIndex: nextWordIndex };
    const stateWithExposure = await ensureCurrentWordExposure(
      transaction,
      userId,
      lesson.wordSenseIds,
      nextState,
    );
    const currentStep =
      stateWithExposure.phase === LESSON_PHASE.PRACTICE
        ? lesson.wordSenseIds.length
        : stateWithExposure.wordIndex;
    const [updatedSession] = await transaction
      .update(learningSessions)
      .set({ currentStep, state: stateWithExposure, updatedAt: new Date() })
      .where(and(eq(learningSessions.id, session.id), eq(learningSessions.userId, userId)))
      .returning(lessonSessionColumns);

    if (!updatedSession) {
      throw new Error('Unable to save lesson progress');
    }

    return { ...updatedSession, state: stateWithExposure };
  });
}
