import { z } from 'zod';

import { LEARNING_LIMITS } from '@/features/learning/learning.constants';

export const LESSON_PHASE = {
  LEARN: 'learn',
  PRACTICE: 'practice',
} as const;

const lessonPhaseSchema = z.enum(LESSON_PHASE);

export const lessonKeySchema = z.string().trim().min(1).max(LEARNING_LIMITS.LESSON_KEY_MAX_LENGTH);

export const lessonSessionStateSchema = z.object({
  phase: lessonPhaseSchema,
  seenWordIds: z.array(z.number().int().positive()).max(20),
  wordIndex: z.number().int().min(0),
});

export const advanceLessonInputSchema = z.object({
  expectedWordId: z.number().int().positive(),
  expectedWordIndex: z.number().int().min(0),
  lessonKey: lessonKeySchema,
  sessionId: z.uuid(),
});

export type LessonPhase = z.infer<typeof lessonPhaseSchema>;
export type LessonSessionState = z.infer<typeof lessonSessionStateSchema>;

export function createInitialLessonState(): LessonSessionState {
  return { phase: LESSON_PHASE.LEARN, seenWordIds: [], wordIndex: 0 };
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
    phase: result.data.phase,
    seenWordIds: [...new Set(result.data.seenWordIds.filter((id) => allowedWordIds.has(id)))],
    wordIndex: Math.min(result.data.wordIndex, lastWordIndex),
  };
}
