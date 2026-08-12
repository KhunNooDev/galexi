import { getTranslations } from 'next-intl/server';

export default async function AdminLoading() {
  const t = await getTranslations();

  return (
    <main className='flex-1 bg-background px-4 py-8 sm:px-8'>
      <section aria-busy='true' className='mx-auto max-w-7xl' role='status'>
        <span className='sr-only'>{t('boundaries.adminLoading')}</span>
        <div aria-hidden='true' className='animate-pulse space-y-6 motion-reduce:animate-none'>
          <div className='galexi-toolbar p-5'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div className='h-8 w-48 rounded-xl bg-secondary-hover' />
              <div className='h-11 w-full rounded-2xl bg-secondary-hover sm:w-72' />
            </div>
          </div>
          <div className='grid gap-4 lg:grid-cols-2'>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className='h-60 rounded-3xl border border-border bg-surface' />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
