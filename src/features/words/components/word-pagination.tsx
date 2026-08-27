'use client';

import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid2X2,
  List,
} from 'lucide-react';

import { FilterCombobox } from '@/components/filter-combobox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type WordView = 'grid' | 'list';

const PAGE_SIZE_OPTIONS = [
  { label: '6', value: '6' },
  { label: '12', value: '12' },
  { label: '24', value: '24' },
] as const;

const MAX_VISIBLE_PAGE_BUTTONS = 5;

function getVisiblePageNumbers(activePage: number, totalPages: number) {
  const visibleCount = Math.min(totalPages, MAX_VISIBLE_PAGE_BUTTONS);
  const preferredStart = activePage - Math.floor(visibleCount / 2);
  const startPage = Math.min(
    Math.max(preferredStart, 1),
    Math.max(totalPages - visibleCount + 1, 1),
  );

  return Array.from({ length: visibleCount }, (_, index) => startPage + index);
}

type WordPaginationProps = {
  activePage: number;
  totalPages: number;
  pageSize: number;
  totalResults: number;
  view: WordView;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewChange: (view: WordView) => void;
};

export function WordPagination({
  activePage,
  totalPages,
  pageSize,
  totalResults,
  view,
  onPageChange,
  onPageSizeChange,
  onViewChange,
}: WordPaginationProps) {
  const t = useTranslations();
  const pageNumbers = getVisiblePageNumbers(activePage, totalPages);

  return (
    <div className='galexi-panel flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between'>
      <nav
        className='order-2 flex items-center justify-center gap-0 md:order-1 md:justify-start md:gap-1'
        aria-label={t('words.manager.paginationLabel')}
      >
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='hidden cursor-pointer rounded-xl border-border bg-surface md:inline-flex dark:bg-surface'
          aria-label={t('words.manager.firstPage')}
          disabled={activePage === 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft aria-hidden='true' className='size-4' />
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='cursor-pointer rounded-xl border-border bg-surface dark:bg-surface'
          aria-label={t('words.manager.previousPage')}
          disabled={activePage === 1}
          onClick={() => onPageChange(Math.max(1, activePage - 1))}
        >
          <ChevronLeft aria-hidden='true' className='size-4' />
        </Button>
        {pageNumbers.map((page) => (
          <Button
            key={page}
            type='button'
            variant={page === activePage ? 'default' : 'ghost'}
            size='icon'
            className={cn(
              'cursor-pointer rounded-xl',
              page === activePage && 'shadow-md shadow-primary/20',
            )}
            aria-label={t('words.manager.goToPage', { page })}
            aria-current={page === activePage ? 'page' : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='cursor-pointer rounded-xl border-border bg-surface dark:bg-surface'
          aria-label={t('words.manager.nextPage')}
          disabled={activePage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, activePage + 1))}
        >
          <ChevronRight aria-hidden='true' className='size-4' />
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='hidden cursor-pointer rounded-xl border-border bg-surface md:inline-flex dark:bg-surface'
          aria-label={t('words.manager.lastPage')}
          disabled={activePage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight aria-hidden='true' className='size-4' />
        </Button>
      </nav>

      <div className='order-1 flex items-center justify-between gap-2 border-b border-border pb-3 md:order-2 md:justify-end md:gap-3 md:border-0 md:pb-0'>
        <p className='min-w-0 flex-1 truncate text-xs text-muted-foreground sm:flex-none sm:text-sm'>
          {t('words.manager.showingResults', {
            from: (activePage - 1) * pageSize + 1,
            to: Math.min(activePage * pageSize, totalResults),
            total: totalResults,
          })}
        </p>
        <FilterCombobox
          value={String(pageSize)}
          ariaLabel={t('words.manager.pageSizeLabel')}
          className='w-18 shrink-0 sm:w-20'
          options={PAGE_SIZE_OPTIONS}
          searchPlaceholder={t('words.manager.pageSizeLabel')}
          noResultsLabel={t('words.manager.pageSizeLabel')}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        />
        <div className='flex rounded-xl border border-border bg-surface p-1 dark:bg-surface'>
          <Button
            type='button'
            variant={view === 'grid' ? 'default' : 'ghost'}
            size='icon-sm'
            className='cursor-pointer rounded-lg'
            aria-label={t('words.manager.gridView')}
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
          >
            <Grid2X2 aria-hidden='true' className='size-4' />
          </Button>
          <Button
            type='button'
            variant={view === 'list' ? 'default' : 'ghost'}
            size='icon-sm'
            className='cursor-pointer rounded-lg'
            aria-label={t('words.manager.listView')}
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
          >
            <List aria-hidden='true' className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
