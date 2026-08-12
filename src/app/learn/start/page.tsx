import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Play } from 'lucide-react';

import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { OnboardingShell } from '@/features/learning/components/onboarding-shell';
import { StartLearningForm } from '@/features/learning/components/start-learning-form';
import { getOrCreateCurrentLearningProfile } from '@/features/learning/server/learning-profile.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LearningStartPage() {
  const [identity, t] = await Promise.all([getCurrentIdentity(), getTranslations()]);

  if (identity.kind !== IDENTITY_KIND.PUBLIC) {
    const profile = await getOrCreateCurrentLearningProfile();

    if (!profile.goal) {
      redirect(ROUTES.LEARN_GOAL);
    }

    if (!profile.level) {
      redirect(ROUTES.LEARN_LEVEL);
    }

    redirect(ROUTES.LEARN_READY);
  }

  return (
    <OnboardingShell identity={identity} step={0} stepLabel={t('learning.progress.start')}>
      <span className='grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary'>
        <Play aria-hidden='true' className='size-5 fill-current' />
      </span>
      <h1 className='mt-5 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
        {t('learning.start.title')}
      </h1>
      <p className='mt-3 max-w-lg text-base leading-7 text-muted-foreground'>
        {t('learning.start.description')}
      </p>
      <StartLearningForm
        className='mt-7 items-start'
        label={t('learning.start.action')}
        pendingLabel={t('learning.starting')}
      />
      <p className='mt-4 text-sm text-muted-foreground'>{t('learning.start.guestNote')}</p>
    </OnboardingShell>
  );
}
