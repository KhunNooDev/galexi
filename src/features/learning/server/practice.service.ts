import 'server-only';

import { and, eq, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress } from '@/db/schema';
import { LEARNING_LIMITS } from '@/features/learning/learning.constants';
import {
  LESSON_PHASE,
  type LessonWord,
  normalizeLessonSessionState,
  submitPracticeAnswerInputSchema,
} from '@/features/learning/lesson.schema';
import {
  addPracticeAnswer,
  buildPracticeQuestions,
  MASTERY_CHANGE,
} from '@/features/learning/lessons/lesson-activities';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import {
  findOwnedLessonSession,
  type LessonTransaction,
  lockLessonSession,
} from '@/features/learning/server/lesson-session.persistence';

async function updatePracticeWordSenseProgress(
  transaction: LessonTransaction,
  userId: string,
  wordSenseId: number,
  isCorrect: boolean,
) {
  const now = new Date();
  const mastery = isCorrect ? MASTERY_CHANGE.CORRECT : 0;
  const masteryUpdate = isCorrect
    ? sql`least(${LEARNING_LIMITS.MASTERY_MAX}, ${userWordProgress.mastery} + ${MASTERY_CHANGE.CORRECT})`
    : sql`greatest(0, ${userWordProgress.mastery} + ${MASTERY_CHANGE.INCORRECT})`;
  const countUpdate = isCorrect
    ? { correctCount: sql`${userWordProgress.correctCount} + 1` }
    : { incorrectCount: sql`${userWordProgress.incorrectCount} + 1` };

  await transaction
    .insert(userWordProgress)
    .values({
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      lastSeenAt: now,
      mastery,
      userId,
      wordSenseId,
    })
    .onConflictDoUpdate({
      target: [userWordProgress.userId, userWordProgress.wordSenseId],
      set: {
        ...countUpdate,
        lastSeenAt: now,
        mastery: masteryUpdate,
        updatedAt: now,
      },
    });
}

export async function submitCurrentPracticeAnswer(
  lesson: LessonDefinition,
  words: readonly LessonWord[],
  input: unknown,
) {
  const values = submitPracticeAnswerInputSchema.parse(input);

  if (values.lessonKey !== lesson.key) {
    throw new Error('Lesson does not match the requested session');
  }

  const questions = buildPracticeQuestions(words, lesson.conversation);
  const question = questions.find((candidate) => candidate.id === values.questionId);

  if (!question) {
    throw new Error('Practice question is unavailable');
  }

  const { userId } = await requireLearningIdentity();

  return getDatabase().transaction(async (transaction) => {
    await lockLessonSession(transaction, userId, lesson.key);
    const session = await findOwnedLessonSession(transaction, userId, lesson.key, values.sessionId);

    if (!session) {
      throw new Error('Lesson session is unavailable');
    }

    const state = normalizeLessonSessionState(session.state, lesson.wordSenseIds);
    const existingAnswer = state.practice.answers.find(
      (answer) => answer.questionId === question.id,
    );

    if (!existingAnswer) {
      const currentQuestion = questions[state.practice.answers.length];

      if (state.phase !== LESSON_PHASE.PRACTICE || currentQuestion?.id !== question.id) {
        throw new Error('Practice question is not current');
      }
    }

    const result = addPracticeAnswer(state, question, values.selectedOptionId, questions.length);

    if (!result.isDuplicate) {
      await updatePracticeWordSenseProgress(
        transaction,
        userId,
        result.answer.wordSenseId,
        result.answer.isCorrect,
      );

      const correctCount = result.state.practice.answers.filter(
        (answer) => answer.isCorrect,
      ).length;
      const score = Math.round((correctCount / questions.length) * LEARNING_LIMITS.SCORE_MAX);
      const [updatedSession] = await transaction
        .update(learningSessions)
        .set({
          currentStep: lesson.wordSenseIds.length + result.state.practice.answers.length,
          score,
          state: result.state,
          updatedAt: new Date(),
        })
        .where(and(eq(learningSessions.id, session.id), eq(learningSessions.userId, userId)))
        .returning({ id: learningSessions.id });

      if (!updatedSession) {
        throw new Error('Unable to save practice progress');
      }
    }

    return {
      feedback: {
        correctOptionId: question.correctOptionId,
        isCorrect: result.answer.isCorrect,
        meaning: question.targetWordMeaning,
        word: question.targetWordText,
      },
      state: result.state,
    };
  });
}
