import 'server-only';

import { and, count, countDistinct, desc, eq, gt } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';
import { resolveLearningContinuation } from '@/features/learning/learning-continuation';
import { normalizeLessonSessionState } from '@/features/learning/lesson.schema';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import { getOrCreateCurrentLearningProfile } from '@/features/learning/server/learning-profile.service';

const currentSessionColumns = {
  currentStep: learningSessions.currentStep,
  id: learningSessions.id,
  lessonKey: learningSessions.lessonKey,
  state: learningSessions.state,
};

const recentSessionColumns = {
  id: learningSessions.id,
  lessonKey: learningSessions.lessonKey,
  score: learningSessions.score,
};

export async function getCurrentLearningHome() {
  const [{ userId }, profile] = await Promise.all([
    requireLearningIdentity(),
    getOrCreateCurrentLearningProfile(),
  ]);
  const database = getDatabase();
  const [inProgressRows, completedRows, completedCountRows, practicedCountRows] = await Promise.all(
    [
      database
        .select(currentSessionColumns)
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
          ),
        )
        .orderBy(desc(learningSessions.updatedAt))
        .limit(1),
      database
        .select(recentSessionColumns)
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.status, LEARNING_SESSION_STATUS.COMPLETED),
          ),
        )
        .orderBy(desc(learningSessions.completedAt))
        .limit(1),
      database
        .select({ count: countDistinct(learningSessions.lessonKey) })
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.status, LEARNING_SESSION_STATUS.COMPLETED),
          ),
        ),
      database
        .select({ count: count() })
        .from(userWordProgress)
        .where(and(eq(userWordProgress.userId, userId), gt(userWordProgress.seenCount, 0))),
    ],
  );
  const inProgressSession = inProgressRows[0];
  const completedSession = completedRows[0];
  const inProgressLesson = inProgressSession
    ? getLessonDefinition(inProgressSession.lessonKey)
    : null;
  const inProgressState =
    inProgressSession && inProgressLesson
      ? normalizeLessonSessionState(inProgressSession.state, inProgressLesson.wordIds)
      : null;
  const continuation = resolveLearningContinuation({
    completedLessonKey: completedSession?.lessonKey,
    goal: profile.goal,
    inProgress:
      inProgressSession && inProgressState
        ? {
            currentStep: inProgressSession.currentStep,
            lessonKey: inProgressSession.lessonKey,
            phase: inProgressState.phase,
            sessionId: inProgressSession.id,
          }
        : undefined,
    level: profile.level,
    onboardingCompletedAt: profile.onboardingCompletedAt,
  });

  return {
    completedLessonCount: completedCountRows[0]?.count ?? 0,
    continuation,
    recentLesson: completedSession
      ? {
          lessonKey: completedSession.lessonKey,
          score: completedSession.score ?? 0,
          sessionId: completedSession.id,
        }
      : null,
    wordsPracticed: practicedCountRows[0]?.count ?? 0,
  };
}
