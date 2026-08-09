import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';
import { getCategoryRoute, ROUTES } from '@/constants/routes';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { CategoryWordCard } from '@/features/categories/components/category-word-card';
import { CategoryWordFilters } from '@/features/categories/components/category-word-filters';
import {
  getPublicCategory,
  listPublicWordsByCategory,
} from '@/features/categories/server/category.service';

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<'/categories/[slug]'>) {
  const [{ slug }, filters] = await Promise.all([params, searchParams]);
  const category = await getPublicCategory(slug);
  if (!category) notFound();

  const query = typeof filters.q === 'string' ? filters.q : '';
  const requestedPartOfSpeech =
    typeof filters.partOfSpeech === 'string' ? filters.partOfSpeech : '';
  const partOfSpeech = PART_OF_SPEECH_OPTIONS.some(
    (option) => option.value === requestedPartOfSpeech,
  )
    ? requestedPartOfSpeech
    : '';
  const [t, entries] = await Promise.all([
    getTranslations(),
    listPublicWordsByCategory(category.id, { query, partOfSpeech }),
  ]);

  return (
    <main className='min-h-svh bg-background pb-12'>
      <PageHeader backHref={ROUTES.CATEGORIES} backLabel={t('categories.backToCategories')} />
      <div className='mx-auto max-w-7xl px-5 py-10 sm:px-8'>
        <div className='flex items-center gap-4'>
          <span className='grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary'>
            <CategoryIcon slug={category.slug} className='size-7' />
          </span>
          <div>
            <h1 className='text-3xl font-semibold text-surface-foreground sm:text-4xl'>
              {category.name}
            </h1>
            <p className='mt-1 text-muted-foreground'>
              {t('categories.wordCount', { count: category.wordCount })}
            </p>
          </div>
        </div>

        <CategoryWordFilters
          key={`${query}:${partOfSpeech}`}
          action={getCategoryRoute(category.slug)}
          defaultQuery={query}
          defaultPartOfSpeech={partOfSpeech}
          searchLabel={t('categories.searchWithinLabel')}
          searchPlaceholder={t('categories.searchWithin', { category: category.name })}
          partOfSpeechLabel={t('categories.partOfSpeechFilter')}
          partOfSpeechSearchPlaceholder={t('categories.partOfSpeechSearchPlaceholder')}
          allPartsOfSpeechLabel={t('categories.allPartsOfSpeech')}
          noResultsLabel={t('categories.partOfSpeechNoResults')}
          filterLabel={t('categories.filter')}
        />

        {entries.length === 0 ? (
          <p className='mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground'>
            {t('categories.noWords')}
          </p>
        ) : (
          <ul className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {entries.map((word) => (
              <li key={word.id} className='h-full'>
                <CategoryWordCard
                  word={word}
                  imageAlt={t('words.flashcard.imageAlt', { word: word.word })}
                  ipaLabel={t('words.flashcard.ipaLabel')}
                  thaiPronunciationLabel={t('words.flashcard.thaiPronunciationLabel')}
                  meaningsLabel={t('words.flashcard.meaningsTitle')}
                  openLabel={t('categories.openFlashcard')}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
