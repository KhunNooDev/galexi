import { describe, expect, it } from 'vitest';

import {
  mergeLearningProfiles,
  mergeWordProgress,
  selectPreferredInProgressSession,
} from '@/features/learning/account/merge-learning-data';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';
import { createInitialLessonState, LESSON_PHASE } from '@/features/learning/lesson.schema';

describe('learning account merge rules', () => {
  it('keeps destination profile values and fills only missing values from the Guest', () => {
    const sourceCompletion = new Date('2026-08-10T10:00:00Z');

    expect(
      mergeLearningProfiles(
        {
          goal: 'travel',
          level: 'beginner',
          onboardingCompletedAt: sourceCompletion,
        },
        { goal: 'work', level: null, onboardingCompletedAt: null },
      ),
    ).toEqual({
      goal: 'work',
      level: 'beginner',
      onboardingCompletedAt: sourceCompletion,
    });
  });

  it('does not create an impossible completed profile', () => {
    expect(
      mergeLearningProfiles(
        { goal: 'travel', level: null, onboardingCompletedAt: new Date() },
        null,
      )?.onboardingCompletedAt,
    ).toBeNull();
  });

  it('prefers the furthest valid active phase, then the latest update', () => {
    const baseState = createInitialLessonState();
    const learn = {
      id: 'learn',
      startedAt: new Date('2026-08-10T08:00:00Z'),
      state: baseState,
      status: LEARNING_SESSION_STATUS.IN_PROGRESS,
      updatedAt: new Date('2026-08-12T08:00:00Z'),
    };
    const conversation = {
      ...learn,
      id: 'conversation',
      state: { ...baseState, phase: LESSON_PHASE.CONVERSATION },
      updatedAt: new Date('2026-08-11T08:00:00Z'),
    };

    expect(selectPreferredInProgressSession([learn, conversation])?.id).toBe('conversation');

    const newerConversation = {
      ...conversation,
      id: 'newer-conversation',
      updatedAt: new Date('2026-08-13T08:00:00Z'),
    };
    expect(selectPreferredInProgressSession([conversation, newerConversation])?.id).toBe(
      'newer-conversation',
    );
  });

  it('adds independent counters but keeps the strongest incremental mastery', () => {
    expect(
      mergeWordProgress(
        {
          correctCount: 2,
          incorrectCount: 1,
          lastSeenAt: new Date('2026-08-13T01:00:00Z'),
          mastery: 15,
          seenCount: 3,
        },
        {
          correctCount: 4,
          incorrectCount: 2,
          lastSeenAt: new Date('2026-08-12T01:00:00Z'),
          mastery: 30,
          seenCount: 5,
        },
      ),
    ).toEqual({
      correctCount: 6,
      incorrectCount: 3,
      lastSeenAt: new Date('2026-08-13T01:00:00Z'),
      mastery: 30,
      seenCount: 8,
    });
  });
});
