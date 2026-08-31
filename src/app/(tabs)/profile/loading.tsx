import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function ProfileLoading() {
  const t = await getTranslations('boundaries');

  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <section
          aria-busy='true'
          className='mx-auto max-w-xl px-5 pt-8 sm:px-6 sm:pt-12'
          role='status'
        >
          <span className='sr-only'>{t('profileLoading')}</span>
          <SkeletonPulse>
            <div className='flex flex-col items-center'>
              <SkeletonBlock className='size-20 rounded-3xl' />
              <div className='mt-4 flex items-center gap-2'>
                <SkeletonBlock className='h-8 w-36' />
                <SkeletonBlock className='size-5 rounded-full' />
              </div>
              <SkeletonBlock className='mt-2 h-4 w-48 rounded-full' />
            </div>

            <SkeletonBlock className='mt-7 h-12 w-full rounded-2xl' />

            <div className='mt-9'>
              <SkeletonBlock className='h-3 w-28 rounded-full' />
              <div className='mt-3 divide-y divide-border border-y border-border'>
                {Array.from({ length: 2 }, (_, index) => (
                  <div key={index} className='flex min-h-18 items-center gap-3 py-4'>
                    <SkeletonBlock className='size-9 shrink-0 rounded-xl' />
                    <div className='flex-1'>
                      <SkeletonBlock className='h-4 w-24 rounded-full' />
                      <SkeletonBlock className='mt-2 h-3 w-44 max-w-full rounded-full' />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SkeletonBlock className='mx-auto mt-7 h-11 w-28 rounded-xl' />
          </SkeletonPulse>
        </section>
      </div>
    </main>
  );
}
