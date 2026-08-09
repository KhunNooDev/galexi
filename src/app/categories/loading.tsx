import { getTranslations } from 'next-intl/server';

export default async function CategoriesLoading() {
  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background px-5 py-28 sm:px-8'>
      <section aria-busy='true' className='mx-auto max-w-7xl' role='status'>
        <span className='sr-only'>{t('boundaries.categoriesLoading')}</span>
        <div aria-hidden='true' className='animate-pulse motion-reduce:animate-none'>
          <div className='h-12 w-72 rounded-xl bg-secondary-hover' />
          <div className='mt-4 h-6 w-64 rounded-lg bg-secondary-hover' />
          <div className='mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className='min-h-52 rounded-3xl bg-secondary-hover' />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
