import { getTranslations } from 'next-intl/server';

export default async function LearningLoading() {
  const t = await getTranslations('learning');

  return (
    <main className='grid min-h-svh place-items-center bg-background px-5 py-12 sm:px-8'>
      <section aria-busy='true' className='w-full max-w-2xl' role='status'>
        <span className='sr-only'>{t('loading')}</span>
        <div aria-hidden='true' className='animate-pulse space-y-5 motion-reduce:animate-none'>
          <div className='ml-auto h-4 w-24 rounded-full bg-secondary-hover' />
          <div className='grid grid-cols-3 gap-2'>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className='h-1.5 rounded-full bg-secondary-hover' />
            ))}
          </div>
          <div className='galexi-panel space-y-5 p-6 sm:p-8'>
            <div className='size-12 rounded-2xl bg-secondary-hover' />
            <div className='h-9 w-3/4 rounded-xl bg-secondary-hover' />
            <div className='h-5 w-full rounded-full bg-secondary-hover' />
            <div className='grid gap-3 sm:grid-cols-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className='h-20 rounded-2xl bg-secondary-hover' />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
