import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { PageHeader } from '@/components/page-header';
import { decodeWordRouteParam, getWordSearchReturnTo } from '@/constants/routes';
import { WordFlashcard } from '@/features/words/components/word-flashcard';
import { listPublicWordEntries } from '@/features/words/server/word.service';

export default async function SearchWordPage({
  params,
  searchParams,
}: PageProps<'/words/search/[word]'>) {
  const { word: wordParam } = await params;
  const decodedWord = decodeWordRouteParam(wordParam);
  const publicEntries = await listPublicWordEntries(decodedWord);

  if (publicEntries.length === 0) {
    notFound();
  }

  const t = await getTranslations();
  const backHref = getWordSearchReturnTo((await searchParams).returnTo);
  const fromCategory = backHref.startsWith('/categories/');

  return (
    <main className='min-h-svh bg-background pb-28 lg:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={backHref}
          backLabel={t(fromCategory ? 'words.search.backToTopic' : 'words.search.backToSearch')}
        />

        <div className='px-4 py-8 sm:px-8 lg:py-10'>
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
              <WordFlashcard key={word.id} word={word} mode='dictionary' />
            ))}
          </div>
        </div>
      </div>
      <MobileBottomNavigation active={fromCategory ? 'categories' : 'words'} />
    </main>
  );
}
