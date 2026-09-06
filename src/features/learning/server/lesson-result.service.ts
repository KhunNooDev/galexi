import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress, words, wordSenses } from '@/db/schema';
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
  wordSenseIds: readonly number[],
) {
  const progress = await transaction
    .select({
      mastery: userWordProgress.mastery,
      wordSenseId: userWordProgress.wordSenseId,
    })
    .from(userWordProgress)
    .where(
      and(
        eq(userWordProgress.userId, userId),
        inArray(userWordProgress.wordSenseId, [...wordSenseIds]),
      ),
    );

  return new Map(progress.map((item) => [item.wordSenseId, item.mastery]));
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

    const state = normalizeLessonSessionState(session.state, lesson.wordSenseIds);

    if (session.status === LEARNING_SESSION_STATUS.COMPLETED && state.result) {
      return toLessonResult(state.result, state.practice.answers);
    }

    if (session.status === LEARNING_SESSION_STATUS.COMPLETED) {
      throw new Error('Completed lesson result is unavailable');
    }

    const lessonWords = await transaction
      .select({ id: wordSenses.id, meaningsTh: wordSenses.meaningsTh, word: words.word })
      .from(wordSenses)
      .innerJoin(words, eq(words.id, wordSenses.wordId))
      .where(and(inArray(wordSenses.id, [...lesson.wordSenseIds]), eq(wordSenses.isPublic, true)));
    const wordsById = new Map(lessonWords.map((word) => [word.id, word]));
    const orderedWords = lesson.wordSenseIds.map((wordSenseId) => wordsById.get(wordSenseId));

    const resultWords = orderedWords.map((word) => {
      if (!word) {
        throw new Error('Lesson content is unavailable');
      }

      return word;
    });
    const questions = buildPracticeQuestions(resultWords, lesson.conversation);
    const completedAt = new Date();
    const masteryByWordSenseId = await loadMastery(transaction, userId, lesson.wordSenseIds);
    const snapshot = getStableLessonResultSnapshot(state.result, {
      completedAt,
      conversation: lesson.conversation,
      masteryByWordSenseId,
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

    return toLessonResult(snapshot, state.practice.answers);
  });
}

function toLessonResult(
  snapshot: NonNullable<ReturnType<typeof normalizeLessonSessionState>['result']>,
  answers: ReturnType<typeof normalizeLessonSessionState>['practice']['answers'],
) {
  return {
    ...snapshot,
    missedWordSenseIds: answers
      .filter((answer) => !answer.isCorrect)
      .map((answer) => answer.wordSenseId),
    words: snapshot.mastery.map((word) => ({
      id: word.wordSenseId,
      label: getMasteryLabel(word.value),
      meaning: word.meaning,
      word: word.word,
    })),
  };
}
