import { useTranslations } from 'next-intl';
import { BookOpenText, LoaderCircle, Tags } from 'lucide-react';

import { SkeletonBlock, SkeletonPulse } from '@/components/loading-skeleton';

type AdminKind = 'words' | 'categories';

export function AdminManagerSkeleton({ kind }: { kind: AdminKind }) {
  const t = useTranslations();
  const Icon = kind === 'words' ? BookOpenText : Tags;

  return (
    <section role='status' aria-busy='true' className='space-y-4'>
      <div className='galexi-toolbar space-y-4 p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
              <Icon aria-hidden='true' className='size-5' />
            </span>
            <div>
              <h2 className='text-xl font-semibold text-surface-foreground'>
                {kind === 'words' ? t('words.manager.listTitle') : t('categories.manager.title')}
              </h2>
              <p className='mt-0.5 flex items-center gap-2 text-sm text-muted-foreground'>
                <LoaderCircle
                  aria-hidden='true'
                  className='size-3.5 animate-spin motion-reduce:animate-none'
                />
                {t('boundaries.adminUpdating')}
              </p>
            </div>
          </div>
          <SkeletonPulse>
            <SkeletonBlock className='h-11 w-28' />
          </SkeletonPulse>
        </div>
        <SkeletonPulse className='flex gap-2'>
          <SkeletonBlock className='h-12 min-w-0 flex-1 rounded-2xl' />
          {kind === 'words' && <SkeletonBlock className='size-12 shrink-0 rounded-2xl' />}
          <SkeletonBlock className='size-12 shrink-0 rounded-2xl' />
        </SkeletonPulse>
      </div>
      <SkeletonPulse className='space-y-4'>
        <div className='galexi-panel flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between'>
          <div className='order-2 flex justify-center gap-1 md:order-1'>
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonBlock key={index} className='size-8 sm:size-9' />
            ))}
          </div>
          <div className='order-1 flex items-center justify-between gap-3 border-b border-border pb-3 md:order-2 md:border-0 md:pb-0'>
            <SkeletonBlock className='h-4 w-28' />
            <SkeletonBlock className='h-10 w-18' />
            <SkeletonBlock className='h-10 w-20' />
          </div>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className={`flex gap-3 rounded-3xl border border-border bg-surface p-4 ${kind === 'words' ? 'min-h-32' : 'min-h-28'}`}
            >
              {kind === 'categories' && (
                <SkeletonBlock className='size-12 shrink-0 rounded-2xl sm:size-14' />
              )}
              <div className='min-w-0 flex-1 space-y-3'>
                <SkeletonBlock className={index % 2 === 0 ? 'h-6 w-28' : 'h-6 w-36'} />
                <SkeletonBlock className='h-3.5 w-3/5' />
                {kind === 'words' && (
                  <div className='flex gap-2'>
                    <SkeletonBlock className='h-6 w-16 rounded-full' />
                    <SkeletonBlock className='h-6 w-20 rounded-full' />
                  </div>
                )}
              </div>
              <SkeletonBlock className='h-8 w-5 shrink-0' />
            </div>
          ))}
        </div>
      </SkeletonPulse>
    </section>
  );
}

export function AdminPageSkeleton({ kind }: { kind: AdminKind }) {
  return (
    <main className='min-h-svh overflow-x-clip bg-background pb-10'>
      <div className='border-b border-border bg-surface/92'>
        <SkeletonPulse className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8'>
          <div className='flex items-center gap-2.5'>
            <SkeletonBlock className='size-10 rounded-2xl' />
            <SkeletonBlock className='h-5 w-16' />
          </div>
          <div className='flex gap-2'>
            <SkeletonBlock className='hidden h-10 w-64 rounded-full lg:block' />
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={index} className='size-10 rounded-full' />
            ))}
          </div>
        </SkeletonPulse>
      </div>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10'>
        <AdminManagerSkeleton kind={kind} />
      </div>
    </main>
  );
}
