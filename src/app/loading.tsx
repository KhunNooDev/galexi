import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations();

  return (
    <main className='flex flex-1 justify-center bg-background px-5 py-10 sm:px-8'>
      <section aria-busy='true' className='w-full max-w-7xl' role='status'>
        <span className='sr-only'>{t('boundaries.loading')}</span>
        <div aria-hidden='true' className='animate-pulse space-y-6 motion-reduce:animate-none'>
          <div className='galexi-toolbar grid gap-6 sm:p-6 lg:grid-cols-[1fr_30rem] lg:items-center'>
            <div className='space-y-3'>
              <div className='h-9 w-64 rounded-xl bg-secondary-hover' />
              <div className='h-4 w-80 max-w-full rounded-full bg-secondary-hover' />
            </div>
            <div className='h-12 rounded-2xl bg-secondary-hover' />
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className='h-36 rounded-3xl border border-border bg-surface' />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
