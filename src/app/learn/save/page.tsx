import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, LogIn, ShieldCheck, UserPlus } from 'lucide-react';

import {
  beginExistingAccountTransfer,
  completeAccountUpgrade,
  requestAccountUpgrade,
  retryExistingAccountTransfer,
} from '@/app/learn/save/actions';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { AUTH_MODE } from '@/constants/auth';
import { IDENTITY_KIND } from '@/constants/identity';
import { getAuthRoute, ROUTES } from '@/constants/routes';
import { RetryTransferButton } from '@/features/learning/account/components/retry-transfer-button';
import { SaveAccountForm } from '@/features/learning/account/components/save-account-form';
import { getCurrentLearningHome } from '@/features/learning/server/learning-home.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

type SaveAccountPageProps = {
  searchParams: Promise<{ status?: string | string[]; step?: string | string[] }>;
};

export default async function SaveAccountPage({ searchParams }: SaveAccountPageProps) {
  const [identity, params, t] = await Promise.all([
    getCurrentIdentity(),
    searchParams,
    getTranslations('learning.saveAccount'),
  ]);
  const step = Array.isArray(params.step) ? params.step[0] : params.step;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(getAuthRoute(AUTH_MODE.SIGN_UP, ROUTES.LEARN_SAVE));
  }

  const isPasswordStep = step === 'password';
  const isMergeFailure = status === 'merge-failed';

  if (identity.kind !== IDENTITY_KIND.GUEST && !isPasswordStep && !isMergeFailure) {
    redirect(ROUTES.LEARN_HOME);
  }

  if (identity.kind === IDENTITY_KIND.GUEST && isPasswordStep) {
    redirect(`${ROUTES.LEARN_SAVE}?step=create`);
  }

  const home = identity.kind === IDENTITY_KIND.GUEST ? await getCurrentLearningHome() : null;
  const isCreateStep = step === 'create';

  return (
    <main className='min-h-svh bg-background'>
      <PageHeader brand identity={identity} />
      <div className='mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col'>
        <section className='flex flex-1 flex-col items-center bg-[#050816] px-6 pt-8 pb-10 text-center text-[#eaf1ff] sm:pt-10'>
          <p className='inline-flex items-center gap-2 text-sm font-medium text-[#7aa2ff]'>
            <CheckCircle2 aria-hidden='true' className='size-5' />
            {t('lessonComplete')}
          </p>
          <Image
            src='/save-progress-orbit.png'
            alt=''
            width={640}
            height={640}
            priority
            className='mt-2 size-48 object-cover sm:size-56'
          />
          <h1 className='max-w-sm text-3xl font-semibold tracking-tight sm:text-4xl'>
            {t('heroTitle', { count: home?.wordsPracticed ?? 0 })}
          </h1>
          <p className='mt-3 max-w-xs text-sm leading-6 text-[#9ca8c8]'>{t('heroDescription')}</p>
        </section>

        <section className='relative -mt-4 rounded-t-4xl border-x border-t border-border bg-surface px-6 pt-7 pb-8 shadow-[0_-20px_60px_rgb(34_74_150/14%)] sm:px-8'>
          <div className='mx-auto mb-5 h-1 w-12 rounded-full bg-border' aria-hidden='true' />
          <h2 className='text-center text-2xl font-semibold tracking-tight text-surface-foreground'>
            {isPasswordStep
              ? t('passwordTitle')
              : isMergeFailure
                ? t('mergeFailedTitle')
                : isCreateStep
                  ? t('createTitle')
                  : t('sheetTitle')}
          </h2>
          <p className='mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-muted-foreground'>
            {isPasswordStep
              ? t('passwordDescription')
              : isMergeFailure
                ? t('mergeFailedDescription')
                : isCreateStep
                  ? t('createDescription')
                  : t('sheetDescription')}
          </p>

          <div className='mt-6'>
            {isPasswordStep ? (
              <SaveAccountForm action={completeAccountUpgrade} kind='password' />
            ) : isMergeFailure ? (
              <div className='space-y-3'>
                <RetryTransferButton action={retryExistingAccountTransfer} />
                <Button asChild variant='ghost' className='h-11 w-full rounded-2xl text-primary'>
                  <Link href={ROUTES.LEARN_HOME}>{t('continueLearning')}</Link>
                </Button>
              </div>
            ) : isCreateStep ? (
              <div className='space-y-4'>
                <SaveAccountForm action={requestAccountUpgrade} kind='email' />
                <div
                  className='flex items-center gap-3 text-xs text-muted-foreground'
                  aria-hidden='true'
                >
                  <span className='h-px flex-1 bg-border' />
                  {t('or')}
                  <span className='h-px flex-1 bg-border' />
                </div>
                <form action={beginExistingAccountTransfer}>
                  <Button type='submit' variant='outline' className='h-12 w-full rounded-2xl'>
                    <LogIn aria-hidden='true' />
                    {t('useExistingInstead')}
                  </Button>
                </form>
              </div>
            ) : (
              <div className='space-y-3'>
                <Button asChild className='h-12 w-full rounded-2xl shadow-lg shadow-primary/20'>
                  <Link href={`${ROUTES.LEARN_SAVE}?step=create`}>
                    <UserPlus aria-hidden='true' />
                    {t('createAccount')}
                  </Link>
                </Button>
                <form action={beginExistingAccountTransfer}>
                  <Button type='submit' variant='outline' className='h-12 w-full rounded-2xl'>
                    <LogIn aria-hidden='true' />
                    {t('existingAccount')}
                  </Button>
                </form>
                <Button asChild variant='ghost' className='h-11 w-full rounded-2xl text-primary'>
                  <Link href={ROUTES.LEARN_HOME}>{t('notNow')}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className='mt-6 flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground'>
            <ShieldCheck aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-primary' />
            <p>{t('privacyNote')}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
