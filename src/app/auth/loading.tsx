import { getTranslations } from 'next-intl/server';

import { AuthPageShell } from '@/components/auth-page-shell';
import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function AuthLoading() {
  const t = await getTranslations();

  return (
    <AuthPageShell backLabel={t('auth.backHome')} themeLabel={t('home.themeToggle')}>
      <section
        aria-busy='true'
        className='mx-3 w-[calc(100%-1.5rem)] max-w-lg rounded-t-4xl border border-auth-field-border bg-auth-card p-5 shadow-[0_-16px_50px_rgb(34_74_150/16%)] sm:mx-6 sm:w-[calc(100%-3rem)] sm:p-8 md:mx-0 md:w-full md:rounded-4xl md:p-10'
        role='status'
      >
        <span className='sr-only'>{t('boundaries.loading')}</span>
        <SkeletonPulse>
          <SkeletonBlock className='h-12 rounded-2xl' />
          <SkeletonBlock className='mx-auto mt-6 h-9 w-48 sm:mt-8' />
          <SkeletonBlock className='mx-auto mt-3 hidden h-4 w-72 max-w-full rounded-full sm:block' />
          <div className='mt-7 space-y-5'>
            <div>
              <SkeletonBlock className='mb-2 h-4 w-16 rounded-full' />
              <SkeletonBlock className='h-12 rounded-2xl' />
            </div>
            <div>
              <SkeletonBlock className='mb-2 h-4 w-20 rounded-full' />
              <SkeletonBlock className='h-12 rounded-2xl' />
            </div>
            <SkeletonBlock className='mt-4 h-12 rounded-2xl' />
          </div>
          <SkeletonBlock className='mx-auto mt-5 h-4 w-44 rounded-full' />
        </SkeletonPulse>
      </section>
    </AuthPageShell>
  );
}
