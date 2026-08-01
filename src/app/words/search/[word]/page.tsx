import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { WordFlashcard } from '@/components/word-flashcard';
import { decodeWordRouteParam, ROUTES } from '@/constants/routes';
import { listPublicWordEntries } from '@/server/words';

export default async function SearchWordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word: wordParam } = await params;
  const decodedWord = decodeWordRouteParam(wordParam);
  const publicEntries = await listPublicWordEntries(decodedWord);

  if (publicEntries.length === 0) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className='min-h-full bg-background px-4 py-6 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-5xl'>
        <header className='mb-8 flex items-center justify-between gap-4'>
          <Link
            href={ROUTES.SEARCH_WORDS}
            className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            {t('words.search.backToSearch')}
          </Link>
          <ThemeToggle label={t('home.themeToggle')} />
        </header>

        {publicEntries.length > 1 && (
          <p className='mx-auto mb-6 max-w-3xl text-center text-sm text-muted-foreground'>
            {t('words.search.multipleEntries', {
              count: publicEntries.length,
              word: publicEntries[0].word,
            })}
          </p>
        )}

        <div className='grid gap-8'>
          {publicEntries.map((word) => (
            <WordFlashcard key={word.id} word={word} />
          ))}
        </div>
      </div>
    </main>
  );
}
