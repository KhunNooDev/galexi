import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';
import { ALPHABET } from '@/constants/alphabet';

export default async function WordsSearchLoading() {
  const t = await getTranslations();

  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-12'>
      <div className='mx-auto max-w-7xl'>
        <section
          aria-busy='true'
          className='mx-auto w-full max-w-5xl px-4 pt-4 sm:px-8 sm:pt-8 lg:pt-10'
          role='status'
        >
          <span className='sr-only'>{t('boundaries.wordsLoading')}</span>
          <SkeletonPulse>
            <SkeletonBlock className='h-12 rounded-2xl sm:h-16 sm:rounded-3xl' />
            <SkeletonBlock className='mt-4 h-4 w-20 rounded-full sm:mt-6' />

            <div className='mt-6 -mr-2 grid grid-cols-[minmax(0,1fr)_1.75rem] items-start gap-3 sm:mt-8 sm:mr-0 sm:grid-cols-[minmax(0,1fr)_2rem] sm:gap-4'>
              <div className='space-y-8 sm:space-y-10'>
                {Array.from({ length: 3 }, (_, groupIndex) => (
                  <div key={groupIndex}>
                    <SkeletonBlock className='mb-3 ml-1 size-6 rounded-lg sm:mb-4' />
                    <div className='grid gap-2.5 sm:grid-cols-2 sm:gap-3'>
                      {Array.from({ length: groupIndex === 0 ? 3 : 2 }, (_, cardIndex) => (
                        <div
                          key={cardIndex}
                          className='flex min-h-16 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2.5 sm:min-h-20 sm:gap-3 sm:px-4 sm:py-3'
                        >
                          <SkeletonBlock className='size-9 shrink-0 rounded-xl sm:size-10' />
                          <SkeletonBlock className='h-4 min-w-0 flex-1 rounded-full' />
                          <SkeletonBlock className='h-3 w-20 rounded-full' />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className='fixed top-[13.75rem] right-1 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex max-h-[36rem] w-7 flex-col items-center justify-between rounded-full border border-border bg-surface/88 py-1 backdrop-blur-xl sm:right-8 sm:w-8 lg:right-[max(2rem,calc((100vw-64rem)/2))]'>
                {ALPHABET.map((letter) => (
                  <span
                    key={letter}
                    className='grid min-h-3.5 w-7 flex-1 place-items-center text-[0.6rem] leading-none font-semibold text-muted-foreground/35'
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          </SkeletonPulse>
        </section>
      </div>
    </main>
  );
}
