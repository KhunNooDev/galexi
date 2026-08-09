import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, Search } from 'lucide-react';

import { CategoryIcon } from '@/components/category-icon';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { getCategoryRoute, ROUTES } from '@/constants/routes';
import { listPublicCategories } from '@/server/categories';

export default async function CategoriesPage({ searchParams }: PageProps<'/categories'>) {
  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q : '';
  const [t, categories] = await Promise.all([getTranslations(), listPublicCategories(q)]);
  const groups = [categories.slice(0, 6), categories.slice(6)].filter((group) => group.length > 0);

  return (
    <main className='min-h-svh bg-background pb-12'>
      <PageHeader backHref={ROUTES.HOME} backLabel={t('categories.backHome')} />
      <div className='mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16'>
        <div className='grid gap-8 lg:grid-cols-[1fr_30rem] lg:items-center'>
          <div>
            <h1 className='text-4xl font-semibold tracking-tight text-surface-foreground sm:text-5xl'>
              {t('categories.pageTitle')}
            </h1>
            <p className='mt-3 text-lg text-muted-foreground sm:text-xl'>
              {t('categories.pageDescription')}
            </p>
          </div>
          <form action={ROUTES.CATEGORIES} className='relative'>
            <Search className='pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              name='q'
              defaultValue={q}
              aria-label={t('categories.searchLabel')}
              placeholder={t('categories.searchPlaceholder')}
              className='h-14 rounded-2xl border-border bg-surface pr-5 pl-13 text-base'
            />
          </form>
        </div>

        {categories.length === 0 ? (
          <p className='mt-16 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground'>
            {q ? t('categories.noResults') : t('categories.empty')}
          </p>
        ) : (
          <div className='mt-16 space-y-12'>
            {groups.map((group, index) => (
              <section key={index}>
                <h2 className='mb-6 text-2xl font-semibold text-surface-foreground'>
                  {index === 0 ? t('categories.everydayLife') : t('categories.exploreMore')}
                </h2>
                <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                  {group.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={getCategoryRoute(category.slug)}
                        className='group flex min-h-52 flex-col rounded-3xl border border-border bg-surface/70 p-6 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-focus/40 focus-visible:outline-none'
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
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
