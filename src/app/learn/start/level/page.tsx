import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { LearningChoiceForm } from '@/features/learning/components/learning-choice-form';
import { OnboardingShell } from '@/features/learning/components/onboarding-shell';
import { getOrCreateCurrentLearningProfile } from '@/features/learning/server/learning-profile.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LearningLevelPage() {
  const [identity, t] = await Promise.all([getCurrentIdentity(), getTranslations()]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const profile = await getOrCreateCurrentLearningProfile();

  if (!profile.goal) {
    redirect(ROUTES.LEARN_GOAL);
  }

  return (
    <OnboardingShell
      backHref={ROUTES.LEARN_GOAL}
      backLabel={t('learning.back')}
      identity={identity}
      step={2}
      stepLabel={t('learning.progress.step', { current: 2, total: 3 })}
    >
      <p className='text-sm font-semibold tracking-[0.14em] text-primary uppercase'>
        {t('learning.level.eyebrow')}
      </p>
      <h1 className='mt-3 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
        {t('learning.level.title')}
      </h1>
      <p className='mt-3 text-base leading-7 text-muted-foreground'>
        {t('learning.level.description')}
      </p>
      <LearningChoiceForm initialValue={profile.level} type='level' />
    </OnboardingShell>
  );
}
