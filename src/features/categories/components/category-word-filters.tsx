'use client';

import { useState } from 'react';
import Form from 'next/form';
import { Search, SlidersHorizontal } from 'lucide-react';

import { FilterCombobox } from '@/components/filter-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PART_OF_SPEECH_OPTIONS } from '@/constants/part-of-speech';

type CategoryWordFiltersProps = {
  action: string;
  allPartsOfSpeechLabel: string;
  defaultPartOfSpeech: string;
  defaultQuery: string;
  filterLabel: string;
  noResultsLabel: string;
  partOfSpeechLabel: string;
  partOfSpeechSearchPlaceholder: string;
  searchLabel: string;
  searchPlaceholder: string;
};

export function CategoryWordFilters({
  action,
  allPartsOfSpeechLabel,
  defaultPartOfSpeech,
  defaultQuery,
  filterLabel,
  noResultsLabel,
  partOfSpeechLabel,
  partOfSpeechSearchPlaceholder,
  searchLabel,
  searchPlaceholder,
}: CategoryWordFiltersProps) {
  const [partOfSpeech, setPartOfSpeech] = useState(defaultPartOfSpeech);
  const options = [{ label: allPartsOfSpeechLabel, value: '' }, ...PART_OF_SPEECH_OPTIONS];

  return (
    <Form
      action={action}
      scroll={false}
      className='mt-8 grid gap-3 rounded-3xl border border-border bg-surface/70 p-4 shadow-sm backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_15rem_auto]'
    >
      <label className='relative min-w-0'>
        <span className='sr-only'>{searchLabel}</span>
        <Search
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground'
        />
        <Input
          type='search'
          name='q'
          defaultValue={defaultQuery}
          placeholder={searchPlaceholder}
          className='h-11 rounded-full border-border bg-background pr-4 pl-10 dark:bg-background'
        />
      </label>

      <input type='hidden' name='partOfSpeech' value={partOfSpeech} />
      <FilterCombobox
        value={partOfSpeech}
        ariaLabel={partOfSpeechLabel}
        options={options}
        searchPlaceholder={partOfSpeechSearchPlaceholder}
        noResultsLabel={noResultsLabel}
        className='w-full'
        onValueChange={setPartOfSpeech}
      />

      <Button type='submit' className='h-11 rounded-full px-6 shadow-lg shadow-primary/15'>
        <SlidersHorizontal aria-hidden='true' className='size-4' />
        {filterLabel}
      </Button>
    </Form>
  );
}
