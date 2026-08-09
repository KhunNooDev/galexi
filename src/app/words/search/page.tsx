import Link from 'next/link';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { BookOpenText } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { getPublicWordRoute, ROUTES } from '@/constants/routes';
import { listPublicWordSummaries } from '@/features/words/server/word.service';

export default async function SearchWordsPage() {
  await connection();
  const t = await getTranslations();
  const publicWords = await listPublicWordSummaries();

  return (
    <main className='min-h-svh bg-background px-4 pb-6 sm:px-8 sm:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.HOME}
          backLabel={t('words.search.backHome')}
          className='mb-10'
        />

        <div className='mx-auto max-w-5xl'>
          <div className='mb-10 max-w-2xl space-y-3'>
            <h1 className='text-4xl font-semibold tracking-tight text-foreground'>
              {t('words.search.pageTitle')}
            </h1>
            <p className='text-lg leading-8 text-muted-foreground'>
              {t('words.search.pageDescription')}
            </p>
          </div>

          {publicWords.length === 0 ? (
            <p className='rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground'>
              {t('words.search.empty')}
            </p>
          ) : (
            <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {publicWords.map(({ entries, word }) => (
                <li key={word.toLocaleLowerCase()}>
                  <Link
                    href={getPublicWordRoute(word)}
                    className='group flex h-full items-center gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'
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
