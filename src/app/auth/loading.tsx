import { getTranslations } from 'next-intl/server';

import { AuthPageShell } from '@/components/auth-page-shell';
import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function AuthLoading() {
  const t = await getTranslations();

  return (
    <AuthPageShell>
      <section
        aria-busy='true'
        className='w-full max-w-lg rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_80px_rgb(34_74_150/10%)] sm:p-8 lg:p-9'
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
            <SkeletonBlock className='h-10 rounded-xl' />
            <SkeletonBlock className='mt-4 h-12 rounded-2xl' />
          </div>
          <SkeletonBlock className='mx-auto mt-5 h-4 w-44 rounded-full' />
        </SkeletonPulse>
      </section>
    </AuthPageShell>
  );
}
