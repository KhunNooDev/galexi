'use server';

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import {
  learningGoalInputSchema,
  learningLevelInputSchema,
} from '@/features/learning/learning.schema';
import {
  getCurrentLearningEntryRoute,
  saveCurrentLearningGoal,
  saveCurrentLearningLevelAndComplete,
} from '@/features/learning/server/learning-profile.service';
import { getCurrentIdentity, startOrResumeGuestSession } from '@/lib/supabase/auth';

export type LearningOnboardingActionState = {
  error?: string;
};

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function startLearning(): Promise<LearningOnboardingActionState> {
  const t = await getTranslations();
  let destination: string;

  try {
    const identity = await getCurrentIdentity();

    if (identity.kind === IDENTITY_KIND.PUBLIC) {
      await startOrResumeGuestSession();
      destination = ROUTES.LEARN_START;
    } else {
      destination = await getCurrentLearningEntryRoute();
    }
  } catch (error) {
    console.error('Unable to start or resume learning', error);
    return { error: t('learning.errors.start') };
  }

  redirect(destination);
}

export async function saveLearningGoal(
  _state: LearningOnboardingActionState,
  formData: FormData,
): Promise<LearningOnboardingActionState> {
  const [t, identity] = await Promise.all([getTranslations(), getCurrentIdentity()]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    return { error: t('learning.errors.sessionLost') };
  }

  const result = learningGoalInputSchema.safeParse({ goal: getFormValue(formData, 'goal') });

  if (!result.success) {
    return { error: t('learning.errors.invalidChoice') };
  }

  try {
    await saveCurrentLearningGoal(result.data);
  } catch (error) {
    console.error('Unable to save learning goal', error);
    return { error: t('learning.errors.update') };
  }

  redirect(ROUTES.LEARN_LEVEL);
}

export async function saveLearningLevel(
  _state: LearningOnboardingActionState,
  formData: FormData,
): Promise<LearningOnboardingActionState> {
  const [t, identity] = await Promise.all([getTranslations(), getCurrentIdentity()]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    return { error: t('learning.errors.sessionLost') };
  }

  const result = learningLevelInputSchema.safeParse({ level: getFormValue(formData, 'level') });

  if (!result.success) {
    return { error: t('learning.errors.invalidChoice') };
  }

  try {
    await saveCurrentLearningLevelAndComplete(result.data);
  } catch (error) {
    console.error('Unable to save learning level', error);
    return { error: t('learning.errors.update') };
  }

  redirect(ROUTES.LEARN_READY);
}
