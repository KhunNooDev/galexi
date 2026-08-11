import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Search } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategoryRoute, ROUTES } from '@/constants/routes';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { listPublicCategories } from '@/features/categories/server/category.service';

export default async function CategoriesPage({ searchParams }: PageProps<'/categories'>) {
  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q : '';
  const [t, categories] = await Promise.all([getTranslations(), listPublicCategories(q)]);
  return (
    <main className='min-h-svh bg-background pb-12'>
      <PageHeader backHref={ROUTES.HOME} backLabel={t('categories.backHome')} />
      <div className='mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12'>
        <section className='galexi-toolbar grid gap-6 sm:p-6 lg:grid-cols-[1fr_30rem] lg:items-center'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
              {t('categories.pageTitle')}
            </h1>
            <p className='mt-2 text-sm leading-6 text-muted-foreground sm:text-base'>
              {t('categories.pageDescription')}
            </p>
          </div>
          <form action={ROUTES.CATEGORIES} className='grid grid-cols-[minmax(0,1fr)_3rem] gap-2'>
            <label className='relative'>
              <Search className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground' />
              <span className='sr-only'>{t('categories.searchLabel')}</span>
              <Input
                type='search'
                name='q'
                defaultValue={q}
                placeholder={t('categories.searchPlaceholder')}
                className='h-12 rounded-2xl border-border bg-field pr-5 pl-12 text-base dark:bg-field'
              />
            </label>
            <Button
              type='submit'
              size='icon-lg'
              className='size-12 rounded-2xl shadow-lg shadow-primary/20'
              aria-label={t('categories.searchLabel')}
            >
              <Search aria-hidden='true' className='size-5' />
            </Button>
          </form>
        </section>

        {categories.length === 0 ? (
          <p className='galexi-empty mt-8'>
            {q ? t('categories.noResults') : t('categories.empty')}
          </p>
        ) : (
          <ul className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={getCategoryRoute(category.slug)}
                  className='group flex min-h-44 flex-col rounded-3xl border border-border bg-surface p-6 shadow-[0_14px_40px_rgb(34_74_150/6%)] transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-focus/40 focus-visible:outline-none'
                >
                  <div className='flex items-start justify-between text-primary'>
                    <CategoryIcon slug={category.slug} className='size-11 stroke-[1.5]' />
                    <ChevronRight className='size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary' />
                  </div>
                  <div className='mt-auto pt-8'>
                    <h3 className='text-lg font-semibold text-surface-foreground'>
                      {category.name}
                    </h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t('categories.wordCount', { count: category.wordCount })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
