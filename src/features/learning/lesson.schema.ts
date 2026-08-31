import { z } from 'zod';

import { LEARNING_LIMITS } from '@/features/learning/learning.constants';

export const LESSON_PHASE = {
  CONVERSATION: 'conversation',
  LEARN: 'learn',
  PRACTICE: 'practice',
  RESULT: 'result',
} as const;

const lessonPhaseSchema = z.enum(LESSON_PHASE);

const lessonKeySchema = z.string().trim().min(1).max(LEARNING_LIMITS.LESSON_KEY_MAX_LENGTH);

const practiceAnswerSchema = z.object({
  isCorrect: z.boolean(),
  questionId: z.string().trim().min(1).max(120),
  selectedOptionId: z.string().trim().min(1).max(160),
  wordSenseId: z.number().int().positive(),
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
        wordSenseId: z.number().int().positive(),
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
  seenWordSenseIds: z.array(z.number().int().positive()).max(20),
  wordIndex: z.number().int().min(0),
});

export const advanceLessonInputSchema = z.object({
  expectedWordSenseId: z.number().int().positive(),
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
export type LessonWord = {
  exampleSentence: string;
  exampleSentenceMeaningTh: string;
  id: number;
  meaningsTh: string[];
  partOfSpeech: string;
  pronunciationIpa: string;
  pronunciationThai: string;
  word: string;
};

export function createInitialLessonState(): LessonSessionState {
  return {
    conversation: { responses: [] },
    phase: LESSON_PHASE.LEARN,
    practice: { answers: [] },
    seenWordSenseIds: [],
    wordIndex: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addCompatibleWordSenseId(value: unknown) {
  return isRecord(value) ? { ...value, wordSenseId: value.wordSenseId ?? value.wordId } : value;
}

export function normalizeLessonSessionState(
  state: unknown,
  wordSenseIds: readonly number[],
): LessonSessionState {
  // Compatibility for sessions persisted before vocabulary IDs became sense IDs.
  // Migration preserves numeric IDs, so only JSON property names need normalization.
  const legacy = isRecord(state) ? state : null;
  const practiceValue = legacy?.practice;
  const practice = isRecord(practiceValue) ? practiceValue : undefined;
  const answers = Array.isArray(practice?.answers)
    ? practice.answers.map(addCompatibleWordSenseId)
    : undefined;
  const rawResult = legacy?.result;
  const resultValue = isRecord(rawResult) ? rawResult : undefined;
  const mastery = Array.isArray(resultValue?.mastery)
    ? resultValue.mastery.map(addCompatibleWordSenseId)
    : undefined;
  const compatibleState = legacy
    ? {
        ...legacy,
        practice: practice ? { ...practice, answers } : practiceValue,
        result: resultValue ? { ...resultValue, mastery } : rawResult,
        seenWordSenseIds: legacy.seenWordSenseIds ?? legacy.seenWordIds,
      }
    : state;
  const result = lessonSessionStateSchema.safeParse(compatibleState);

  if (!result.success) {
    return createInitialLessonState();
  }

  const allowedWordSenseIds = new Set(wordSenseIds);
  const lastWordIndex = Math.max(0, wordSenseIds.length - 1);

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
          allowedWordSenseIds.has(answer.wordSenseId) &&
          answers.findIndex((candidate) => candidate.questionId === answer.questionId) === index,
      ),
    },
    result: result.data.result,
    seenWordSenseIds: [
      ...new Set(
        result.data.seenWordSenseIds.filter((wordSenseId) => allowedWordSenseIds.has(wordSenseId)),
      ),
    ],
    wordIndex: Math.min(result.data.wordIndex, lastWordIndex),
  };
}
