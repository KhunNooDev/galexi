import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { decodeWordRouteParam, ROUTES } from '@/constants/routes';
import { WordFlashcard } from '@/features/words/components/word-flashcard';
import { listPublicWordEntries } from '@/features/words/server/word.service';

export default async function SearchWordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word: wordParam } = await params;
  const decodedWord = decodeWordRouteParam(wordParam);
  const publicEntries = await listPublicWordEntries(decodedWord);

  if (publicEntries.length === 0) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className='min-h-svh bg-background px-4 pb-6 sm:px-8 sm:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.PUBLIC_WORDS}
          backLabel={t('words.search.backToSearch')}
          className='mb-8'
        />

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
