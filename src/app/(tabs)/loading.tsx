import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function Loading() {
  const t = await getTranslations('boundaries');

  return (
    <main className='relative min-h-[calc(100svh-4rem)] overflow-x-clip bg-background pb-24 lg:pb-0'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute top-1/3 -right-32 size-80 rounded-full bg-cyan-400/10 blur-3xl' />
      </div>

      <div className='relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col'>
        <section
          aria-busy='true'
          className='flex flex-1 flex-col justify-center px-5 py-14 sm:px-8 sm:py-20'
          role='status'
        >
          <span className='sr-only'>{t('homeLoading')}</span>
          <SkeletonPulse>
            <div className='mx-auto max-w-3xl text-center'>
              <SkeletonBlock className='mx-auto h-4 w-44 rounded-full' />
              <SkeletonBlock className='mx-auto mt-5 h-12 w-full max-w-xl rounded-2xl sm:h-16' />
              <div className='mx-auto mt-6 max-w-2xl space-y-3'>
                <SkeletonBlock className='h-4 w-full rounded-full' />
                <SkeletonBlock className='mx-auto h-4 w-4/5 rounded-full' />
              </div>
              <div className='mx-auto mt-8 grid max-w-sm gap-3 sm:max-w-2xl sm:grid-cols-3'>
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock key={index} className='h-12 rounded-full' />
                ))}
              </div>
            </div>

            <div className='mx-auto mt-14 grid w-full max-w-5xl gap-4 md:grid-cols-3'>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className='rounded-3xl border border-border bg-surface p-6'>
                  <SkeletonBlock className='size-10 rounded-2xl' />
                  <SkeletonBlock className='mt-4 h-5 w-36' />
                  <SkeletonBlock className='mt-3 h-4 w-full rounded-full' />
                  <SkeletonBlock className='mt-2 h-4 w-4/5 rounded-full' />
                </div>
              ))}
            </div>
          </SkeletonPulse>
        </section>
      </div>
    </main>
  );
}
