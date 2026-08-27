import Link from 'next/link';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { BookOpen, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPublicWordRoute, ROUTES } from '@/constants/routes';
import { AlphabetIndex } from '@/features/words/components/alphabet-index';
import { listPublicWordSummaries } from '@/features/words/server/word.service';

function getWordInitial(word: string) {
  const initial = word.trim().charAt(0).toLocaleUpperCase();
  return /^[A-Z]$/.test(initial) ? initial : '#';
}

export default async function SearchWordsPage({ searchParams }: PageProps<'/words/search'>) {
  await connection();
  const filters = await searchParams;
  const query = typeof filters.q === 'string' ? filters.q : '';
  const [t, publicWords] = await Promise.all([getTranslations(), listPublicWordSummaries(query)]);
  const wordGroups = Map.groupBy(publicWords, ({ word }) => getWordInitial(word));
  const availableLetters = [...wordGroups.keys()].filter((letter) => letter !== '#');

  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-12'>
      <div className='mx-auto max-w-7xl'>
        <div className='mx-auto w-full max-w-5xl px-4 pt-4 sm:px-8 sm:pt-8 lg:pt-10'>
          <h1 className='sr-only'>{t('words.search.pageTitle')}</h1>

          <section aria-label={t('words.search.pageTitle')}>
            <form action={ROUTES.PUBLIC_WORDS} className='relative -mr-2 sm:mr-0'>
              <label className='relative block'>
                <Search
                  aria-hidden='true'
                  className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground sm:left-5 sm:size-6'
                />
                <span className='sr-only'>{t('words.search.searchLabel')}</span>
                <Input
                  type='search'
                  name='q'
                  defaultValue={query}
                  placeholder={t('words.search.searchPlaceholder')}
                  className='h-12 rounded-2xl border-border bg-field pr-14 pl-12 text-base shadow-[0_12px_34px_rgb(25_65_150/7%)] sm:h-16 sm:rounded-3xl sm:pr-16 sm:pl-15 sm:text-lg dark:bg-field'
                />
              </label>
              <Button
                type='submit'
                size='icon'
                variant='ghost'
                className='absolute top-1/2 right-1.5 size-11 -translate-y-1/2 cursor-pointer rounded-xl text-primary hover:bg-primary/12 hover:text-primary sm:right-2 sm:size-12 sm:rounded-2xl'
                aria-label={t('words.search.searchLabel')}
              >
                <Search aria-hidden='true' className='size-5 sm:size-6' />
              </Button>
            </form>
          </section>

          {publicWords.length > 0 && (
            <p
              className='mt-4 text-sm font-medium text-muted-foreground sm:mt-6 sm:text-base'
              role='status'
            >
              {t('words.search.resultCount', { count: publicWords.length })}
            </p>
          )}

          {publicWords.length === 0 ? (
            <p className='galexi-empty mt-7'>
              {query ? t('words.search.noResults') : t('words.search.empty')}
            </p>
          ) : (
            <div className='mt-6 -mr-2 grid grid-cols-[minmax(0,1fr)_1.75rem] items-start gap-3 sm:mt-8 sm:mr-0 sm:grid-cols-[minmax(0,1fr)_2rem] sm:gap-4'>
              <div className='min-w-0 space-y-8 sm:space-y-10'>
                {[...wordGroups].map(([letter, words]) => (
                  <section
                    key={letter}
                    id={`letter-${letter}`}
                    className='scroll-mt-20'
                    aria-labelledby={`letter-${letter}-heading`}
                  >
                    <h2
                      id={`letter-${letter}-heading`}
                      className='mb-3 pl-1 text-xl font-semibold text-primary sm:mb-4 sm:text-2xl'
                    >
                      {letter}
                    </h2>
                    <ul className='grid gap-2.5 sm:grid-cols-2 sm:gap-3'>
                      {words.map(({ entries, word }) => (
                        <li key={word.toLocaleLowerCase()}>
                          <Link
                            href={getPublicWordRoute(word)}
                            prefetch={false}
                            className='group flex min-h-16 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-[0_10px_30px_rgb(34_74_150/5%)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8 focus-visible:ring-3 focus-visible:ring-focus/30 focus-visible:outline-none sm:min-h-20 sm:gap-3 sm:px-4 sm:py-3'
                          >
                            <span className='grid size-9 shrink-0 place-items-center text-primary sm:size-10'>
                              <BookOpen aria-hidden='true' className='size-5' />
                            </span>
                            <span className='grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
                              <span className='block truncate font-semibold text-surface-foreground transition-colors group-hover:text-primary'>
                                {word}
                              </span>
                              <span className='block truncate text-xs text-muted-foreground'>
                                {t('words.search.entryCount', { count: entries })}
                              </span>
                            </span>
                            <ChevronRight
                              aria-hidden='true'
                              className='size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary'
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <AlphabetIndex
                availableLetters={availableLetters}
                label={t('words.search.alphabetIndex')}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
