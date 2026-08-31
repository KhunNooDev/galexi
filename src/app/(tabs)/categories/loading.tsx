import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

export default async function CategoriesLoading() {
  const t = await getTranslations();

  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-12'>
      <section
        aria-busy='true'
        className='mx-auto max-w-5xl px-5 pt-5 pb-8 sm:px-8 sm:pt-7'
        role='status'
      >
        <span className='sr-only'>{t('boundaries.categoriesLoading')}</span>
        <SkeletonPulse>
          <SkeletonBlock className='h-12 w-full rounded-2xl' />
          <SkeletonBlock className='mt-6 h-4 w-16 rounded-full' />
          <div className='mt-8 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='flex min-h-32 flex-col items-center px-1 py-1'>
                <SkeletonBlock className='size-16 rounded-full' />
                <SkeletonBlock className='mt-3 h-4 w-16 rounded-full' />
                <SkeletonBlock className='mt-2 h-3 w-12 rounded-full' />
              </div>
            ))}
          </div>
        </SkeletonPulse>
      </section>
    </main>
  );
}
