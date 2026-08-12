import { z } from 'zod';

import {
  LEARNING_GOAL,
  LEARNING_LEVEL,
  LEARNING_LIMITS,
  LEARNING_SESSION_STATUS,
} from '@/features/learning/learning.constants';

const learningGoalSchema = z.enum(LEARNING_GOAL);
const learningLevelSchema = z.enum(LEARNING_LEVEL);
const sessionStatusSchema = z.enum(LEARNING_SESSION_STATUS);
const sessionStateSchema = z
  .record(z.string(), z.json())
  .refine(
    (state) =>
      new TextEncoder().encode(JSON.stringify(state)).byteLength <=
      LEARNING_LIMITS.SESSION_STATE_MAX_BYTES,
    'Session state is too large',
  );

export const learningProfileUpdateSchema = z
  .object({
    goal: learningGoalSchema.nullable(),
    level: learningLevelSchema.nullable(),
    onboardingCompletedAt: z.coerce.date().nullable(),
  })
  .partial()
  .refine((values) => Object.keys(values).length > 0, 'At least one profile field is required');

export const createLearningSessionInputSchema = z.object({
  lessonKey: z.string().trim().min(1).max(LEARNING_LIMITS.LESSON_KEY_MAX_LENGTH),
  state: sessionStateSchema.default({}),
});

export const updateLearningSessionInputSchema = z
  .object({
    currentStep: z.number().int().min(0).optional(),
    score: z.number().int().min(0).max(LEARNING_LIMITS.SCORE_MAX).nullable().optional(),
    state: sessionStateSchema.optional(),
    status: sessionStatusSchema.optional(),
  })
  .refine((values) => Object.keys(values).length > 0, 'At least one session field is required');

export const wordProgressInputSchema = z.object({
  correctCount: z.number().int().min(0),
  incorrectCount: z.number().int().min(0),
  lastSeenAt: z.coerce.date().nullable(),
  mastery: z.number().int().min(0).max(LEARNING_LIMITS.MASTERY_MAX),
  seenCount: z.number().int().min(0),
  wordId: z.number().int().positive(),
});

export const learningSessionIdSchema = z.uuid();
