import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, CircleCheck, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { OnboardingShell } from '@/features/learning/components/onboarding-shell';
import {
  ensureCurrentLearningOnboardingComplete,
  getOrCreateCurrentLearningProfile,
} from '@/features/learning/server/learning-profile.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LearningReadyPage() {
  const [identity, t] = await Promise.all([getCurrentIdentity(), getTranslations()]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const profile = await getOrCreateCurrentLearningProfile();

  if (!profile.goal) {
    redirect(ROUTES.LEARN_GOAL);
  }

  if (!profile.level) {
    redirect(ROUTES.LEARN_LEVEL);
  }

  await ensureCurrentLearningOnboardingComplete();

  return (
    <OnboardingShell
      backHref={ROUTES.LEARN_LEVEL}
      backLabel={t('learning.back')}
      identity={identity}
      step={3}
      stepLabel={t('learning.progress.complete')}
    >
      <span className='grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary'>
        <CircleCheck aria-hidden='true' className='size-7' />
      </span>
      <h1 className='mt-5 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
        {t('learning.ready.title')}
      </h1>
      <p className='mt-3 max-w-lg text-base leading-7 text-muted-foreground'>
        {t('learning.ready.description')}
      </p>
      <div className='mt-7 rounded-2xl border border-border bg-field p-4'>
        <div className='flex items-start gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
            <Target aria-hidden='true' className='size-5' />
          </span>
          <div>
            <p className='font-semibold text-surface-foreground'>{t('learning.ready.nextTitle')}</p>
            <p className='mt-1 text-sm leading-6 text-muted-foreground'>
              {t('learning.ready.nextDescription')}
            </p>
          </div>
        </div>
      </div>
      <Button asChild className='mt-7 h-12 rounded-full px-6'>
        <Link href={ROUTES.PUBLIC_WORDS}>
          {t('learning.ready.browseWords')}
          <ArrowRight aria-hidden='true' />
        </Link>
      </Button>
    </OnboardingShell>
  );
}
