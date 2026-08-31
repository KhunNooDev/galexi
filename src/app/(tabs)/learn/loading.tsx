import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function LearningLoading() {
  const t = await getTranslations('boundaries');

  return (
    <main className='relative min-h-[calc(100svh-4rem)] overflow-x-clip bg-background pb-24 lg:pb-0'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/12 blur-3xl' />
        <div className='absolute right-0 bottom-0 size-80 rounded-full bg-cyan-400/7 blur-3xl' />
      </div>
      <div className='relative mx-auto min-h-[calc(100svh-4rem)] max-w-7xl'>
        <section
          aria-busy='true'
          className='mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12'
          role='status'
        >
          <span className='sr-only'>{t('learnHomeLoading')}</span>
          <SkeletonPulse>
            <SkeletonBlock className='h-3 w-24 rounded-full' />
            <SkeletonBlock className='mt-3 h-10 w-72 max-w-full' />
            <SkeletonBlock className='mt-3 h-4 w-full max-w-xl rounded-full' />
            <SkeletonBlock className='mt-2 h-4 w-4/5 max-w-lg rounded-full' />

            <div className='mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.75fr]'>
              <div className='galexi-panel bg-primary/6 p-6 sm:p-8'>
                <SkeletonBlock className='size-12 rounded-2xl' />
                <SkeletonBlock className='mt-5 h-3 w-28 rounded-full' />
                <SkeletonBlock className='mt-3 h-9 w-3/4' />
                <SkeletonBlock className='mt-3 h-4 w-full rounded-full' />
                <SkeletonBlock className='mt-2 h-4 w-4/5 rounded-full' />
                <SkeletonBlock className='mt-6 h-2 w-full rounded-full' />
                <SkeletonBlock className='mt-7 h-12 w-40 rounded-full' />
              </div>

              <div className='grid grid-cols-2 gap-4 lg:grid-cols-1'>
                {Array.from({ length: 2 }, (_, index) => (
                  <div
                    key={index}
                    className='galexi-panel flex min-h-28 flex-col justify-center p-5'
                  >
                    <SkeletonBlock className='h-8 w-16' />
                    <SkeletonBlock className='mt-3 h-4 w-28 rounded-full' />
                  </div>
                ))}
              </div>
            </div>

            <div className='galexi-panel mt-5 flex items-center gap-3 p-5 sm:p-6'>
              <SkeletonBlock className='size-10 shrink-0 rounded-xl' />
              <div className='flex-1'>
                <SkeletonBlock className='h-3 w-24 rounded-full' />
                <SkeletonBlock className='mt-2 h-5 w-40' />
                <SkeletonBlock className='mt-2 h-4 w-28 rounded-full' />
              </div>
            </div>
          </SkeletonPulse>
        </section>
      </div>
    </main>
  );
}
