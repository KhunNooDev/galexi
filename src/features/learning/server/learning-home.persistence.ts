import 'server-only';

import { and, count, countDistinct, desc, eq, gt } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';

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

export async function loadLearningHomeState(userId: string) {
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

  return {
    completedLessonCount: completedCountRows[0]?.count ?? 0,
    inProgressSession: inProgressRows[0] ?? null,
    recentSession: completedRows[0] ?? null,
    wordsPracticed: practicedCountRows[0]?.count ?? 0,
  };
}
