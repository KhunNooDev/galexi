import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { LearningChoiceForm } from '@/features/learning/components/learning-choice-form';
import { OnboardingShell } from '@/features/learning/components/onboarding-shell';
import { getOrCreateCurrentLearningProfile } from '@/features/learning/server/learning-profile.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LearningGoalPage() {
  const [identity, t] = await Promise.all([getCurrentIdentity(), getTranslations()]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const profile = await getOrCreateCurrentLearningProfile();

  return (
    <OnboardingShell
      backHref={ROUTES.HOME}
      backLabel={t('learning.backHome')}
      identity={identity}
      step={1}
      stepLabel={t('learning.progress.step', { current: 1, total: 3 })}
    >
      <p className='text-sm font-semibold tracking-[0.14em] text-primary uppercase'>
        {t('learning.goal.eyebrow')}
      </p>
      <h1 className='mt-3 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
        {t('learning.goal.title')}
      </h1>
      <p className='mt-3 text-base leading-7 text-muted-foreground'>
        {t('learning.goal.description')}
      </p>
      <LearningChoiceForm initialValue={profile.goal} type='goal' />
    </OnboardingShell>
  );
}
