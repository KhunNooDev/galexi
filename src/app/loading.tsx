import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations();

  return (
    <main className='flex flex-1 items-center justify-center bg-background px-5 py-16 sm:px-8'>
      <section aria-busy='true' className='w-full max-w-3xl' role='status'>
        <span className='sr-only'>{t('boundaries.loading')}</span>
        <div aria-hidden='true' className='animate-pulse space-y-8 motion-reduce:animate-none'>
          <div className='mx-auto space-y-4 text-center'>
            <div className='mx-auto h-4 w-40 rounded-full bg-secondary-hover' />
            <div className='mx-auto h-12 w-full max-w-lg rounded-2xl bg-secondary-hover' />
            <div className='mx-auto h-5 w-full max-w-md rounded-full bg-secondary-hover' />
          </div>
          <div className='grid gap-4 sm:grid-cols-3'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='h-40 rounded-3xl border border-border bg-surface' />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
