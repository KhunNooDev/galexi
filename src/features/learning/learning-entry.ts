import { ROUTES } from '@/constants/routes';

type LearningEntryProfile = {
  goal: string | null;
  level: string | null;
  onboardingCompletedAt: Date | null;
};

export function resolveLearningEntry({ goal, level, onboardingCompletedAt }: LearningEntryProfile) {
  if (!goal) return ROUTES.LEARN_GOAL;
  if (!level) return ROUTES.LEARN_LEVEL;
  if (!onboardingCompletedAt) return ROUTES.LEARN_READY;
  return ROUTES.LEARN_HOME;
}
