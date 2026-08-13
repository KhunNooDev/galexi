import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress, words } from '@/db/schema';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';
import { normalizeLessonSessionState } from '@/features/learning/lesson.schema';
import { buildPracticeQuestions } from '@/features/learning/lessons/lesson-activities';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import {
  getMasteryLabel,
  getStableLessonResultSnapshot,
} from '@/features/learning/lessons/lesson-result';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import {
  type LessonTransaction,
  lockLessonSession,
} from '@/features/learning/server/lesson-session.persistence';

const resultSessionColumns = {
  id: learningSessions.id,
  state: learningSessions.state,
  status: learningSessions.status,
};

async function loadMastery(
  transaction: LessonTransaction,
  userId: string,
  wordIds: readonly number[],
) {
  const progress = await transaction
    .select({ mastery: userWordProgress.mastery, wordId: userWordProgress.wordId })
    .from(userWordProgress)
    .where(
      and(eq(userWordProgress.userId, userId), inArray(userWordProgress.wordId, [...wordIds])),
    );

  return new Map(progress.map((item) => [item.wordId, item.mastery]));
}

export async function completeAndGetLessonResult(lesson: LessonDefinition, sessionId: string) {
  const { userId } = await requireLearningIdentity();

  return getDatabase().transaction(async (transaction) => {
    await lockLessonSession(transaction, userId, lesson.key);

    const [session] = await transaction
      .select(resultSessionColumns)
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.id, sessionId),
          eq(learningSessions.userId, userId),
          eq(learningSessions.lessonKey, lesson.key),
          inArray(learningSessions.status, [
            LEARNING_SESSION_STATUS.IN_PROGRESS,
            LEARNING_SESSION_STATUS.COMPLETED,
          ]),
        ),
      )
      .limit(1);

    if (!session) {
      return null;
    }

    const state = normalizeLessonSessionState(session.state, lesson.wordIds);

    if (session.status === LEARNING_SESSION_STATUS.COMPLETED && state.result) {
      return toLessonResult(state.result);
    }

    if (session.status === LEARNING_SESSION_STATUS.COMPLETED) {
      throw new Error('Completed lesson result is unavailable');
    }

    const lessonWords = await transaction
      .select({ id: words.id, meaningsTh: words.meaningsTh, word: words.word })
      .from(words)
      .where(and(inArray(words.id, [...lesson.wordIds]), eq(words.isPublic, true)));
    const wordsById = new Map(lessonWords.map((word) => [word.id, word]));
    const orderedWords = lesson.wordIds.map((wordId) => wordsById.get(wordId));

    const resultWords = orderedWords.map((word) => {
      if (!word) {
        throw new Error('Lesson content is unavailable');
      }

      return word;
    });
    const questions = buildPracticeQuestions(resultWords, lesson.conversation);
    const completedAt = new Date();
    const masteryByWordId = await loadMastery(transaction, userId, lesson.wordIds);
    const snapshot = getStableLessonResultSnapshot(state.result, {
      completedAt,
      conversation: lesson.conversation,
      masteryByWordId,
      questions,
      state,
      words: resultWords,
    });
    const [completedSession] = await transaction
      .update(learningSessions)
      .set({
        completedAt,
        score: snapshot.accuracy,
        state: { ...state, result: snapshot },
        status: LEARNING_SESSION_STATUS.COMPLETED,
        updatedAt: completedAt,
      })
      .where(
        and(
          eq(learningSessions.id, session.id),
          eq(learningSessions.userId, userId),
          eq(learningSessions.status, LEARNING_SESSION_STATUS.IN_PROGRESS),
        ),
      )
      .returning({ id: learningSessions.id });

    if (!completedSession) {
      throw new Error('Unable to complete lesson session');
    }

    return toLessonResult(snapshot);
  });
}

function toLessonResult(
  snapshot: NonNullable<ReturnType<typeof normalizeLessonSessionState>['result']>,
) {
  return {
    ...snapshot,
    words: snapshot.mastery.map((word) => ({
      id: word.wordId,
      label: getMasteryLabel(word.value),
      meaning: word.meaning,
      word: word.word,
    })),
  };
}
