import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { PageHeader } from '@/components/page-header';
import { ROUTES } from '@/constants/routes';

export default async function WordDetailLoading() {
  const [t, tWords] = await Promise.all([
    getTranslations('boundaries'),
    getTranslations('words.search'),
  ]);

  return (
    <main className='min-h-svh bg-background pb-28 lg:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader backHref={ROUTES.PUBLIC_WORDS} backLabel={tWords('backToSearch')} />
        <section aria-busy='true' className='px-4 py-8 sm:px-8 lg:py-10' role='status'>
          <span className='sr-only'>{t('wordLoading')}</span>
          <SkeletonPulse className='mx-auto max-w-3xl rounded-4xl border border-border bg-surface p-4 sm:p-6'>
            <div className='flex flex-col items-center border-b border-border px-4 pt-1 pb-5'>
              <SkeletonBlock className='h-10 w-48 rounded-2xl' />
              <SkeletonBlock className='mt-3 h-6 w-16 rounded-full' />
              <div className='mt-3 flex gap-2'>
                <SkeletonBlock className='h-8 w-28 rounded-full' />
                <SkeletonBlock className='h-8 w-32 rounded-full' />
              </div>
            </div>
            <div className='mt-4 grid min-h-[26rem] place-items-center rounded-3xl border border-dashed border-border px-6 py-10 sm:min-h-[30rem]'>
              <div className='flex w-full max-w-sm flex-col items-center'>
                <SkeletonBlock className='size-12 rounded-2xl' />
                <SkeletonBlock className='mt-5 h-4 w-full rounded-full' />
                <SkeletonBlock className='mt-2 h-4 w-4/5 rounded-full' />
                <SkeletonBlock className='mt-7 h-12 w-36 rounded-2xl' />
              </div>
            </div>
          </SkeletonPulse>
        </section>
      </div>
      <MobileBottomNavigation active='words' />
    </main>
  );
}
