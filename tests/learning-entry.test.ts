import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { resolveLearningEntry } from '@/features/learning/learning-entry';

describe('learning entry', () => {
  it('routes a profile without a goal to Goal', () => {
    expect(resolveLearningEntry({ goal: null, level: null, onboardingCompletedAt: null })).toBe(
      ROUTES.LEARN_GOAL,
    );
  });

  it('routes a profile with only a goal to Level', () => {
    expect(resolveLearningEntry({ goal: 'work', level: null, onboardingCompletedAt: null })).toBe(
      ROUTES.LEARN_LEVEL,
    );
  });

  it('routes a fully configured but incomplete profile to Ready for repair', () => {
    expect(
      resolveLearningEntry({ goal: 'work', level: 'beginner', onboardingCompletedAt: null }),
    ).toBe(ROUTES.LEARN_READY);
  });

  it('routes completed onboarding to the learning home', () => {
    expect(
      resolveLearningEntry({
        goal: 'work',
        level: 'beginner',
        onboardingCompletedAt: new Date('2026-08-18T00:00:00.000Z'),
      }),
    ).toBe(ROUTES.LEARN_HOME);
  });
});
