import { getLessonResultRoute, getLessonRoute, ROUTES } from '@/constants/routes';
import { LESSON_PHASE, type LessonPhase } from '@/features/learning/lesson.schema';
import {
  getFirstLessonDefinition,
  getLessonDefinition,
  getNextLessonDefinition,
} from '@/features/learning/lessons/lesson-catalog';

export const CONTINUATION_KIND = {
  COMPLETE: 'complete',
  CONVERSATION: 'conversation',
  LEARN: 'learn',
  ONBOARDING: 'onboarding',
  PRACTICE: 'practice',
  RESULT: 'result',
} as const;

export type LearningContinuation = {
  href: string | null;
  kind: (typeof CONTINUATION_KIND)[keyof typeof CONTINUATION_KIND];
  lessonKey: string | null;
  progress: number;
};

type ContinuationInput = {
  completedLessonKey?: string;
  goal: string | null;
  inProgress?: {
    currentStep: number;
    lessonKey: string;
    phase: LessonPhase;
    sessionId: string;
  };
  level: string | null;
  onboardingCompletedAt: Date | null;
};

export function resolveLearningContinuation({
  completedLessonKey,
  goal,
  inProgress,
  level,
  onboardingCompletedAt,
}: ContinuationInput): LearningContinuation {
  if (!goal) {
    return {
      href: ROUTES.LEARN_GOAL,
      kind: CONTINUATION_KIND.ONBOARDING,
      lessonKey: null,
      progress: 0,
    };
  }

  if (!level) {
    return {
      href: ROUTES.LEARN_LEVEL,
      kind: CONTINUATION_KIND.ONBOARDING,
      lessonKey: null,
      progress: 0,
    };
  }

  if (!onboardingCompletedAt) {
    return {
      href: ROUTES.LEARN_READY,
      kind: CONTINUATION_KIND.ONBOARDING,
      lessonKey: null,
      progress: 0,
    };
  }

  if (inProgress) {
    const lesson = getLessonDefinition(inProgress.lessonKey);
    const totalSteps = lesson
      ? lesson.wordIds.length * 2 + lesson.conversation.length
      : Math.max(1, inProgress.currentStep + 1);
    const progress =
      inProgress.phase === LESSON_PHASE.RESULT
        ? 100
        : Math.min(99, Math.round((inProgress.currentStep / totalSteps) * 100));

    return {
      href:
        inProgress.phase === LESSON_PHASE.RESULT
          ? getLessonResultRoute(inProgress.lessonKey, inProgress.sessionId)
          : getLessonRoute(inProgress.lessonKey),
      kind: inProgress.phase,
      lessonKey: inProgress.lessonKey,
      progress,
    };
  }

  if (!completedLessonKey) {
    const firstLesson = getFirstLessonDefinition();

    return {
      href: getLessonRoute(firstLesson.key),
      kind: CONTINUATION_KIND.LEARN,
      lessonKey: firstLesson.key,
      progress: 0,
    };
  }

  const nextLesson = getNextLessonDefinition(completedLessonKey);

  if (!nextLesson) {
    return { href: null, kind: CONTINUATION_KIND.COMPLETE, lessonKey: null, progress: 100 };
  }

  return {
    href: getLessonRoute(nextLesson.key),
    kind: CONTINUATION_KIND.LEARN,
    lessonKey: nextLesson.key,
    progress: 0,
  };
}
