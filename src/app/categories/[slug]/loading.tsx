import { getTranslations } from 'next-intl/server';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { PageHeader } from '@/components/page-header';
import { ROUTES } from '@/constants/routes';

export default async function CategoryDetailLoading() {
  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background pb-28 lg:pb-12'>
      <PageHeader backHref={ROUTES.CATEGORIES} backLabel={t('categories.backToCategories')} />
      <section
        aria-busy='true'
        className='mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12'
        role='status'
      >
        <span className='sr-only'>{t('boundaries.categoryLoading')}</span>
        <SkeletonPulse>
          <div className='galexi-toolbar flex items-center gap-4 sm:p-6'>
            <SkeletonBlock className='size-14 shrink-0 rounded-2xl' />
            <div className='flex-1'>
              <SkeletonBlock className='h-8 w-40' />
              <SkeletonBlock className='mt-2 h-4 w-20 rounded-full' />
            </div>
          </div>

          <div className='mt-5 grid gap-3 rounded-3xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:p-5'>
            <SkeletonBlock className='h-12 rounded-2xl' />
            <SkeletonBlock className='h-12 rounded-2xl' />
            <SkeletonBlock className='h-12 rounded-2xl sm:w-28' />
          </div>

          <div className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='rounded-3xl border border-border bg-surface p-5'>
                <SkeletonBlock className='aspect-[4/3] w-full rounded-2xl' />
                <SkeletonBlock className='mt-5 h-6 w-2/3' />
                <SkeletonBlock className='mt-3 h-4 w-full rounded-full' />
                <SkeletonBlock className='mt-2 h-4 w-4/5 rounded-full' />
              </div>
            ))}
          </div>
        </SkeletonPulse>
      </section>
      <MobileBottomNavigation active='categories' />
    </main>
  );
}
