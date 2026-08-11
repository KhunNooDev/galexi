import Link from 'next/link';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpenText, Search } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPublicWordRoute, ROUTES } from '@/constants/routes';
import { listPublicWordSummaries } from '@/features/words/server/word.service';

export default async function SearchWordsPage({ searchParams }: PageProps<'/words/search'>) {
  await connection();
  const filters = await searchParams;
  const query = typeof filters.q === 'string' ? filters.q : '';
  const [t, publicWords] = await Promise.all([getTranslations(), listPublicWordSummaries(query)]);

  return (
    <main className='min-h-svh bg-background pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader backHref={ROUTES.HOME} backLabel={t('words.search.backHome')} />

        <div className='px-5 py-8 sm:px-8 lg:py-12'>
          <section className='galexi-toolbar grid gap-6 sm:p-6 lg:grid-cols-[1fr_30rem] lg:items-center'>
            <div>
              <h1 className='text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
                {t('words.search.pageTitle')}
              </h1>
              <p className='mt-2 text-sm leading-6 text-muted-foreground sm:text-base'>
                {t('words.search.pageDescription')}
              </p>
            </div>
            <form
              action={ROUTES.PUBLIC_WORDS}
              className='grid grid-cols-[minmax(0,1fr)_3rem] gap-2'
            >
              <label className='relative'>
                <Search
                  aria-hidden='true'
                  className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
                />
                <span className='sr-only'>{t('words.search.searchLabel')}</span>
                <Input
                  type='search'
                  name='q'
                  defaultValue={query}
                  placeholder={t('words.search.searchPlaceholder')}
                  className='h-12 rounded-2xl border-border bg-field pr-5 pl-12 text-base dark:bg-field'
                />
              </label>
              <Button
                type='submit'
                size='icon-lg'
                className='size-12 rounded-2xl shadow-lg shadow-primary/20'
                aria-label={t('words.search.searchLabel')}
              >
                <Search aria-hidden='true' className='size-5' />
              </Button>
            </form>
          </section>

          {publicWords.length > 0 && (
            <p className='mt-6 text-sm font-medium text-muted-foreground' role='status'>
              {t('words.search.resultCount', { count: publicWords.length })}
            </p>
          )}

          {publicWords.length === 0 ? (
            <p className='galexi-empty mt-8'>
              {query ? t('words.search.noResults') : t('words.search.empty')}
            </p>
          ) : (
            <ul className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {publicWords.map(({ entries, word }) => (
                <li key={word.toLocaleLowerCase()}>
                  <Link
                    href={getPublicWordRoute(word)}
                    className='group flex h-full min-h-32 items-center gap-4 rounded-3xl border border-border bg-surface p-5 shadow-[0_14px_40px_rgb(34_74_150/6%)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-focus/30 focus-visible:outline-none'
                  >
                    <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary'>
                      <BookOpenText aria-hidden='true' className='size-5' />
                    </span>
                    <span className='min-w-0'>
                      <span className='block font-semibold wrap-break-word text-surface-foreground group-hover:text-primary'>
                        {word}
                      </span>
                      <span className='mt-1 block text-xs text-muted-foreground'>
                        {t('words.search.entryCount', { count: entries })}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden='true'
                      className='ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary'
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
