import { z } from 'zod';

import { LEARNING_LIMITS } from '@/features/learning/learning.constants';

export const LESSON_PHASE = {
  CONVERSATION: 'conversation',
  LEARN: 'learn',
  PRACTICE: 'practice',
  RESULT: 'result',
} as const;

const lessonPhaseSchema = z.enum(LESSON_PHASE);

export const lessonKeySchema = z.string().trim().min(1).max(LEARNING_LIMITS.LESSON_KEY_MAX_LENGTH);

const practiceAnswerSchema = z.object({
  isCorrect: z.boolean(),
  questionId: z.string().trim().min(1).max(120),
  selectedOptionId: z.string().trim().min(1).max(160),
  wordId: z.number().int().positive(),
});

const conversationResponseSchema = z.object({
  responseId: z.string().trim().min(1).max(120),
  turnId: z.string().trim().min(1).max(120),
});

const lessonResultSnapshotSchema = z.object({
  accuracy: z.number().int().min(0).max(100),
  completedAt: z.iso.datetime(),
  conversationTurns: z.number().int().min(0).max(10),
  mastery: z
    .array(
      z.object({
        meaning: z.string().max(1000),
        value: z.number().int().min(0).max(LEARNING_LIMITS.MASTERY_MAX),
        word: z.string().trim().min(1).max(120),
        wordId: z.number().int().positive(),
      }),
    )
    .max(20),
  practiceCorrect: z.number().int().min(0).max(20),
  practiceTotal: z.number().int().min(0).max(20),
});

export const lessonSessionStateSchema = z.object({
  conversation: z
    .object({
      responses: z.array(conversationResponseSchema).max(10),
    })
    .default({ responses: [] }),
  phase: lessonPhaseSchema,
  practice: z
    .object({
      answers: z.array(practiceAnswerSchema).max(20),
    })
    .default({ answers: [] }),
  result: lessonResultSnapshotSchema.optional(),
  seenWordIds: z.array(z.number().int().positive()).max(20),
  wordIndex: z.number().int().min(0),
});

export const advanceLessonInputSchema = z.object({
  expectedWordId: z.number().int().positive(),
  expectedWordIndex: z.number().int().min(0),
  lessonKey: lessonKeySchema,
  sessionId: z.uuid(),
});

export const submitPracticeAnswerInputSchema = z.object({
  lessonKey: lessonKeySchema,
  questionId: z.string().trim().min(1).max(120),
  selectedOptionId: z.string().trim().min(1).max(160),
  sessionId: z.uuid(),
});

export const submitConversationResponseInputSchema = z.object({
  lessonKey: lessonKeySchema,
  responseId: z.string().trim().min(1).max(120),
  sessionId: z.uuid(),
  turnId: z.string().trim().min(1).max(120),
});

export const lessonResultParamsSchema = z.object({
  lessonKey: lessonKeySchema,
  sessionId: z.uuid(),
});

export type LessonPhase = z.infer<typeof lessonPhaseSchema>;
export type LessonResultSnapshot = z.infer<typeof lessonResultSnapshotSchema>;
export type LessonSessionState = z.infer<typeof lessonSessionStateSchema>;

export function createInitialLessonState(): LessonSessionState {
  return {
    conversation: { responses: [] },
    phase: LESSON_PHASE.LEARN,
    practice: { answers: [] },
    seenWordIds: [],
    wordIndex: 0,
  };
}

export function normalizeLessonSessionState(
  state: unknown,
  wordIds: readonly number[],
): LessonSessionState {
  const result = lessonSessionStateSchema.safeParse(state);

  if (!result.success) {
    return createInitialLessonState();
  }

  const allowedWordIds = new Set(wordIds);
  const lastWordIndex = Math.max(0, wordIds.length - 1);

  return {
    conversation: {
      responses: result.data.conversation.responses.filter(
        (response, index, responses) =>
          responses.findIndex((candidate) => candidate.turnId === response.turnId) === index,
      ),
    },
    phase: result.data.phase,
    practice: {
      answers: result.data.practice.answers.filter(
        (answer, index, answers) =>
          allowedWordIds.has(answer.wordId) &&
          answers.findIndex((candidate) => candidate.questionId === answer.questionId) === index,
      ),
    },
    result: result.data.result,
    seenWordIds: [...new Set(result.data.seenWordIds.filter((id) => allowedWordIds.has(id)))],
    wordIndex: Math.min(result.data.wordIndex, lastWordIndex),
  };
}
