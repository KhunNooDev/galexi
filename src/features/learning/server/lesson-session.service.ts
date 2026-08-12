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

const lessonSessionColumns = {
  id: learningSessions.id,
  state: learningSessions.state,
};

type LessonSessionResult = {
  id: string;
  state: LessonSessionState;
};

function lessonSessionLockKey(userId: string, lessonKey: string) {
  return `lesson:${userId}:${lessonKey}`;
}

async function recordWordExposure(
  transaction: Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0],
  userId: string,
  wordId: number,
) {
  const now = new Date();

  await transaction
    .insert(userWordProgress)
    .values({ lastSeenAt: now, seenCount: 1, userId, wordId })
    .onConflictDoUpdate({
      target: [userWordProgress.userId, userWordProgress.wordId],
      set: {
        lastSeenAt: now,
        seenCount: sql`${userWordProgress.seenCount} + 1`,
        updatedAt: now,
      },
    });
}

async function ensureCurrentWordExposure(
  transaction: Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0],
  userId: string,
  wordIds: readonly number[],
  state: LessonSessionState,
) {
  const wordId = wordIds[state.wordIndex];

  if (!wordId || state.seenWordIds.includes(wordId)) {
    return state;
  }

  await recordWordExposure(transaction, userId, wordId);

  return { ...state, seenWordIds: [...state.seenWordIds, wordId] };
}

export async function getOrCreateCurrentLessonSession(
  lesson: LessonDefinition,
): Promise<LessonSessionResult> {
  const { userId } = await requireLearningIdentity();

  return getDatabase().transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${lessonSessionLockKey(userId, lesson.key)}, 0))`,
    );

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

    const normalizedState = normalizeLessonSessionState(session.state, lesson.wordIds);
    const state = await ensureCurrentWordExposure(
      transaction,
      userId,
      lesson.wordIds,
      normalizedState,
    );
    const [updatedSession] = await transaction
      .update(learningSessions)
      .set({ currentStep: state.wordIndex, state, updatedAt: new Date() })
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
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${lessonSessionLockKey(userId, lesson.key)}, 0))`,
    );

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

    const state = normalizeLessonSessionState(session.state, lesson.wordIds);
    const authoritativeWordId = lesson.wordIds[state.wordIndex];

    if (
      state.phase === LESSON_PHASE.PRACTICE ||
      state.wordIndex !== values.expectedWordIndex ||
      authoritativeWordId !== values.expectedWordId
    ) {
      return { ...session, state };
    }

    const nextWordIndex = state.wordIndex + 1;
    const nextState: LessonSessionState =
      nextWordIndex >= lesson.wordIds.length
        ? { ...state, phase: LESSON_PHASE.PRACTICE }
        : { ...state, wordIndex: nextWordIndex };
    const stateWithExposure = await ensureCurrentWordExposure(
      transaction,
      userId,
      lesson.wordIds,
      nextState,
    );
    const currentStep =
      stateWithExposure.phase === LESSON_PHASE.PRACTICE
        ? lesson.wordIds.length
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
