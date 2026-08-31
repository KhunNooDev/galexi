import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { getCategoryRoute, ROUTES } from '@/constants/routes';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { listPublicCategories } from '@/features/categories/server/category.service';

export default async function CategoriesPage({ searchParams }: PageProps<'/categories'>) {
  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q : '';
  const [t, categories] = await Promise.all([getTranslations(), listPublicCategories(q)]);
  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-12'>
      <div className='mx-auto max-w-5xl px-5 pt-5 pb-8 sm:px-8 sm:pt-7'>
        <form action={ROUTES.CATEGORIES}>
          <label className='relative block'>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
            />
            <span className='sr-only'>{t('categories.searchLabel')}</span>
            <Input
              type='search'
              name='q'
              defaultValue={q}
              placeholder={t('categories.searchPlaceholder')}
              className='h-12 rounded-2xl border-border bg-field pr-5 pl-12 text-base shadow-none dark:bg-field'
            />
          </label>
          <button type='submit' className='sr-only'>
            {t('categories.searchLabel')}
          </button>
        </form>

        {categories.length === 0 ? (
          <p className='galexi-empty mt-6'>
            {q ? t('categories.noResults') : t('categories.empty')}
          </p>
        ) : (
          <section aria-labelledby='topic-count' className='mt-6'>
            <p id='topic-count' className='text-sm font-medium text-muted-foreground'>
              {t('categories.topicCount', { count: categories.length })}
            </p>
            <ul className='mt-8 grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6'>
              {categories.map((category) => (
                <li key={category.id} className='min-w-0'>
                  <Link
                    href={getCategoryRoute(category.slug)}
                    className='group flex min-h-32 flex-col items-center rounded-2xl px-1 py-1 text-center transition-colors hover:bg-secondary-hover/45 focus-visible:ring-3 focus-visible:ring-focus/40 focus-visible:outline-none'
                  >
                    <span className='grid size-16 place-items-center rounded-full bg-primary/12 text-primary transition-colors group-hover:bg-primary/18'>
                      <CategoryIcon slug={category.slug} className='size-8 stroke-[1.7]' />
                    </span>
                    <h2 className='mt-3 w-full truncate text-[0.95rem] font-semibold text-surface-foreground'>
                      {category.name}
                    </h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t('categories.wordCount', { count: category.wordCount })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
