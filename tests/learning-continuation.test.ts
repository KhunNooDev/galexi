import { describe, expect, it } from 'bun:test';

import { getLessonResultRoute, getLessonRoute } from '@/constants/routes';
import {
  CONTINUATION_KIND,
  resolveLearningContinuation,
} from '@/features/learning/learning-continuation';
import { LESSON_PHASE } from '@/features/learning/lesson.schema';
import { FIRST_LESSON_KEY } from '@/features/learning/lessons/lesson-catalog';

const completedOnboarding = {
  goal: 'work',
  level: 'beginner',
  onboardingCompletedAt: new Date('2026-08-13T03:00:00.000Z'),
};

describe('learning continuation', () => {
  it.each([LESSON_PHASE.LEARN, LESSON_PHASE.PRACTICE, LESSON_PHASE.CONVERSATION])(
    'continues an in-progress %s phase in the lesson player',
    (phase) => {
      const continuation = resolveLearningContinuation({
        ...completedOnboarding,
        inProgress: {
          currentStep: 4,
          lessonKey: FIRST_LESSON_KEY,
          phase,
          sessionId: '03ef6200-c5a1-4132-8308-192f689c4c33',
        },
      });

      expect(continuation.kind).toBe(phase);
      expect(continuation.href).toBe(getLessonRoute(FIRST_LESSON_KEY));
    },
  );

  it('continues Result at the owned session-specific result route', () => {
    const sessionId = '03ef6200-c5a1-4132-8308-192f689c4c33';
    const continuation = resolveLearningContinuation({
      ...completedOnboarding,
      inProgress: {
        currentStep: 15,
        lessonKey: FIRST_LESSON_KEY,
        phase: LESSON_PHASE.RESULT,
        sessionId,
      },
    });

    expect(continuation.href).toBe(getLessonResultRoute(FIRST_LESSON_KEY, sessionId));
    expect(continuation.progress).toBe(100);
  });

  it('starts the first lesson when no session exists', () => {
    expect(resolveLearningContinuation(completedOnboarding)).toMatchObject({
      href: getLessonRoute(FIRST_LESSON_KEY),
      kind: CONTINUATION_KIND.LEARN,
      progress: 0,
    });
  });

  it('handles a completed catalog with no next lesson', () => {
    expect(
      resolveLearningContinuation({
        ...completedOnboarding,
        completedLessonKey: FIRST_LESSON_KEY,
      }),
    ).toEqual({
      href: null,
      kind: CONTINUATION_KIND.COMPLETE,
      lessonKey: null,
      progress: 100,
    });
  });
});
