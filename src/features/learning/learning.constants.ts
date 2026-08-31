export const LEARNING_GOAL = {
  DAILY_CONVERSATION: 'daily_conversation',
  SCHOOL_EXAM: 'school_exam',
  TRAVEL: 'travel',
  WORK: 'work',
} as const;

export const LEARNING_LEVEL = {
  ADVANCED: 'advanced',
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  STARTER: 'starter',
} as const;

export const LEARNING_SESSION_STATUS = {
  ABANDONED: 'abandoned',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
} as const;

export const LEARNING_LIMITS = {
  LESSON_KEY_MAX_LENGTH: 120,
  MASTERY_MAX: 100,
  SCORE_MAX: 100,
  SESSION_STATE_MAX_BYTES: 32_768,
} as const;
