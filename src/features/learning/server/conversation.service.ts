import 'server-only';

import { and, eq } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { learningSessions, userWordProgress } from '@/db/schema';
import {
  LESSON_PHASE,
  normalizeLessonSessionState,
  submitConversationResponseInputSchema,
} from '@/features/learning/lesson.schema';
import {
  addConversationResponse,
  buildPracticeQuestions,
} from '@/features/learning/lessons/lesson-activities';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import type { LessonWord } from '@/features/learning/server/lesson.service';
import {
  findOwnedLessonSession,
  lockLessonSession,
} from '@/features/learning/server/lesson-session.persistence';

export async function submitCurrentConversationResponse(
  lesson: LessonDefinition,
  words: readonly LessonWord[],
  input: unknown,
) {
  const values = submitConversationResponseInputSchema.parse(input);

  if (values.lessonKey !== lesson.key) {
    throw new Error('Lesson does not match the requested session');
  }

  const questions = buildPracticeQuestions(words, lesson.conversation);
  const turn = lesson.conversation.find((candidate) => candidate.id === values.turnId);

  if (!turn) {
    throw new Error('Conversation turn is unavailable');
  }

  const { userId } = await requireLearningIdentity();

  return getDatabase().transaction(async (transaction) => {
    await lockLessonSession(transaction, userId, lesson.key);
    const session = await findOwnedLessonSession(transaction, userId, lesson.key, values.sessionId);

    if (!session) {
      throw new Error('Lesson session is unavailable');
    }

    const state = normalizeLessonSessionState(session.state, lesson.wordIds);
    const existingResponse = state.conversation.responses.find(
      (response) => response.turnId === turn.id,
    );

    if (!existingResponse) {
      const currentTurn = lesson.conversation[state.conversation.responses.length];

      if (state.phase !== LESSON_PHASE.CONVERSATION || currentTurn?.id !== turn.id) {
        throw new Error('Conversation turn is not current');
      }
    }

    const result = addConversationResponse(
      state,
      turn,
      values.responseId,
      lesson.conversation.length,
    );

    if (!result.isDuplicate) {
      const now = new Date();

      for (const wordId of result.response.wordIds) {
        await transaction
          .insert(userWordProgress)
          .values({ lastSeenAt: now, userId, wordId })
          .onConflictDoUpdate({
            target: [userWordProgress.userId, userWordProgress.wordId],
            set: { lastSeenAt: now, updatedAt: now },
          });
      }

      const [updatedSession] = await transaction
        .update(learningSessions)
        .set({
          currentStep:
            lesson.wordIds.length + questions.length + result.state.conversation.responses.length,
          state: result.state,
          updatedAt: now,
        })
        .where(and(eq(learningSessions.id, session.id), eq(learningSessions.userId, userId)))
        .returning({ id: learningSessions.id });

      if (!updatedSession) {
        throw new Error('Unable to save conversation progress');
      }
    }

    return { state: result.state };
  });
}
