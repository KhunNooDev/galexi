import { getTranslations } from 'next-intl/server';

export default async function CategoriesLoading() {
  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background px-5 py-10 sm:px-8'>
      <section aria-busy='true' className='mx-auto max-w-7xl' role='status'>
        <span className='sr-only'>{t('boundaries.categoriesLoading')}</span>
        <div aria-hidden='true' className='animate-pulse motion-reduce:animate-none'>
          <div className='galexi-toolbar grid gap-6 sm:p-6 lg:grid-cols-[1fr_30rem]'>
            <div className='space-y-3'>
              <div className='h-10 w-72 max-w-full rounded-xl bg-secondary-hover' />
              <div className='h-5 w-52 rounded-full bg-secondary-hover' />
            </div>
            <div className='h-12 rounded-2xl bg-secondary-hover' />
          </div>
          <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className='min-h-44 rounded-3xl bg-secondary-hover' />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
