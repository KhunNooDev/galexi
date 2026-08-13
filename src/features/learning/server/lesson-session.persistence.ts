import 'server-only';

import { and, eq, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';

export const lessonSessionColumns = {
  id: learningSessions.id,
  state: learningSessions.state,
};

export type LessonTransaction = Parameters<
  Parameters<ReturnType<typeof getDatabase>['transaction']>[0]
>[0];

function lessonSessionLockKey(userId: string, lessonKey: string) {
  return `lesson:${userId}:${lessonKey}`;
}

export async function lockLessonSession(
  transaction: LessonTransaction,
  userId: string,
  lessonKey: string,
) {
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${lessonSessionLockKey(userId, lessonKey)}, 0))`,
  );
}

export async function findOwnedLessonSession(
  transaction: LessonTransaction,
  userId: string,
  lessonKey: string,
  sessionId: string,
) {
  const [session] = await transaction
    .select(lessonSessionColumns)
    .from(learningSessions)
    .where(
      and(
        eq(learningSessions.id, sessionId),
        eq(learningSessions.userId, userId),
        eq(learningSessions.lessonKey, lessonKey),
        eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
      ),
    )
    .limit(1);

  return session;
}
