'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenText, Plus, Search, SlidersHorizontal } from 'lucide-react';

import { FilterCombobox } from '@/components/filter-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';
import { cn } from '@/lib/utils';

type WordManagerToolbarProps = {
  resultCount: number;
  categories: { id: number; name: string }[];
  categoryFilter: string;
  partOfSpeechFilter: string;
  onSearch: (query: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onPartOfSpeechFilterChange: (value: string) => void;
  onCreate: () => void;
};

export function WordManagerToolbar({
  resultCount,
  categories,
  categoryFilter,
  partOfSpeechFilter,
  onSearch,
  onCategoryFilterChange,
  onPartOfSpeechFilterChange,
  onCreate,
}: WordManagerToolbarProps) {
  const t = useTranslations();
  const [searchInput, setSearchInput] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const categoryOptions = useMemo(
    () => [
      { label: t('words.manager.allCategories'), value: '' },
      ...categories.map((category) => ({ label: category.name, value: String(category.id) })),
    ],
    [categories, t],
  );
  const partOfSpeechOptions = useMemo(
    () => [{ label: t('words.manager.allPartsOfSpeech'), value: '' }, ...PART_OF_SPEECH_OPTIONS],
    [t],
  );
  const activeFilterCount = Number(Boolean(categoryFilter)) + Number(Boolean(partOfSpeechFilter));

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(searchInput);
  }

  return (
    <div className='galexi-toolbar space-y-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <BookOpenText aria-hidden='true' className='size-5' />
          </span>
          <div className='min-w-0'>
            <h2
              id='word-list-title'
              className='truncate text-xl font-semibold text-surface-foreground'
            >
              {t('words.manager.listTitle')}
            </h2>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {t('words.manager.resultCount', { count: resultCount })}
            </p>
          </div>
        </div>

        <Button
          type='button'
          className='h-11 cursor-pointer rounded-xl bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'
          onClick={onCreate}
        >
          <Plus aria-hidden='true' className='size-4' />
          {t('words.manager.create')}
        </Button>
      </div>

      <form className='flex items-center gap-2' role='search' onSubmit={submitSearch}>
        <label className='relative min-w-0 flex-1'>
          <span className='sr-only'>{t('words.manager.searchLabel')}</span>
          <Search
            aria-hidden='true'
            className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            type='search'
            className='h-12 w-full rounded-2xl border border-border bg-field pr-4 pl-12 text-sm text-surface-foreground shadow-xs outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20 dark:bg-field'
            value={searchInput}
            placeholder={t('words.manager.searchPlaceholder')}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <Button
          type='button'
          variant='outline'
          size='icon-lg'
          className={cn(
            'relative size-12 cursor-pointer rounded-2xl border-border bg-surface text-muted-foreground shadow-xs hover:bg-secondary-hover dark:bg-surface',
            filterPanelOpen && 'border-primary text-primary ring-2 ring-primary/15',
          )}
          aria-label={t('words.manager.filters')}
          aria-expanded={filterPanelOpen}
          onClick={() => setFilterPanelOpen((open) => !open)}
        >
          <SlidersHorizontal aria-hidden='true' className='size-5' />
          {activeFilterCount > 0 && (
            <span className='absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground'>
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button
          type='submit'
          size='icon-lg'
          className='size-12 cursor-pointer rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover'
          aria-label={t('words.manager.searchAction')}
        >
          <Search aria-hidden='true' className='size-5' />
        </Button>
      </form>

      {filterPanelOpen && (
        <div className='grid animate-in gap-3 border-t border-border pt-4 duration-150 fade-in-0 slide-in-from-top-1 sm:grid-cols-2'>
          <FilterCombobox
            value={categoryFilter}
            ariaLabel={t('words.manager.categoryFilterLabel')}
            options={categoryOptions}
            searchPlaceholder={t('words.manager.categoriesSearchPlaceholder')}
            noResultsLabel={t('words.manager.categoriesNoResults')}
            onValueChange={onCategoryFilterChange}
          />
          <FilterCombobox
            value={partOfSpeechFilter}
            ariaLabel={t('words.manager.partOfSpeechFilterLabel')}
            options={partOfSpeechOptions}
            searchPlaceholder={t('words.manager.partOfSpeechSearchPlaceholder')}
            noResultsLabel={t('words.manager.partOfSpeechNoResults')}
            onValueChange={onPartOfSpeechFilterChange}
          />
        </div>
      )}
    </div>
  );
}
