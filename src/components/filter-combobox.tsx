'use client';

import { type KeyboardEvent, type ReactNode, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type FilterOption = {
  label: string;
  value: string;
};

type FilterComboboxProps = {
  ariaLabel: string;
  className?: string;
  contentClassName?: string;
  noResultsLabel: string;
  onValueChange: (value: string) => void;
  options: readonly FilterOption[];
  searchable?: boolean;
  searchPlaceholder: string;
  startIcon?: ReactNode;
  value: string;
};

export function FilterCombobox({
  ariaLabel,
  className,
  contentClassName,
  noResultsLabel,
  onValueChange,
  options,
  searchable = true,
  searchPlaceholder,
  startIcon,
  value,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listboxId = useId();
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const filteredOptions = useMemo(() => {
    if (!searchable) {
      return options;
    }

    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  function getOptionElements() {
    return Array.from(listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
  }

  function focusEdgeOption(edge: 'first' | 'last') {
    const optionElements = getOptionElements();
    optionElements.at(edge === 'first' ? 0 : -1)?.focus();
  }

  function moveOptionFocus(event: KeyboardEvent<HTMLElement>, direction: -1 | 1) {
    const optionElements = getOptionElements();
    const currentIndex = optionElements.indexOf(event.currentTarget);
    const nextOption = optionElements.at(
      (currentIndex + direction + optionElements.length) % optionElements.length,
    );

    if (nextOption) {
      event.preventDefault();
      nextOption.focus();
    }
  }

  function selectOption(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
  }

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          aria-label={ariaLabel}
          aria-haspopup='listbox'
          aria-expanded={open}
          className={cn(
            'h-11 min-w-0 justify-between rounded-2xl border-border bg-field px-4 font-normal text-surface-foreground shadow-none hover:bg-secondary-hover dark:bg-field',
            className,
          )}
        >
          <span className='flex min-w-0 items-center gap-2'>
            {startIcon ? <span className='shrink-0 text-muted-foreground'>{startIcon}</span> : null}
            <span className='truncate'>{selectedOption?.label}</span>
          </span>
          <ChevronDown
            aria-hidden='true'
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        sideOffset={8}
        className={cn(
          'w-(--radix-popover-trigger-width) min-w-56 rounded-2xl border-border bg-surface p-2 shadow-2xl',
          contentClassName,
        )}
        onOpenAutoFocus={(event) => {
          if (searchable) {
            event.preventDefault();
            searchInputRef.current?.focus();
          }
        }}
      >
        {searchable && (
          <div className='relative'>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              ref={searchInputRef}
              role='combobox'
              aria-autocomplete='list'
              aria-controls={listboxId}
              aria-expanded='true'
              value={query}
              placeholder={searchPlaceholder}
              className='h-10 rounded-xl border-border bg-field pr-3 pl-9 dark:bg-field'
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  focusEdgeOption('first');
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusEdgeOption('last');
                }
              }}
            />
          </div>
        )}
        <div
          ref={listboxRef}
          id={listboxId}
          role='listbox'
          aria-label={ariaLabel}
          className={cn(
            'max-h-64 touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            searchable && 'mt-2 scrollbar-gutter-stable',
          )}
        >
          {filteredOptions.length === 0 ? (
            <p className='px-3 py-6 text-center text-sm text-muted-foreground'>{noResultsLabel}</p>
          ) : (
            filteredOptions.map((option) => {
              const selected = option.value === value;

              return (
                <Button
                  key={option.value}
                  type='button'
                  variant='ghost'
                  role='option'
                  aria-selected={selected}
                  className='h-auto w-full cursor-pointer justify-start rounded-xl px-3 py-2.5 text-left font-normal hover:bg-secondary-hover focus:bg-secondary-hover'
                  onClick={() => selectOption(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      moveOptionFocus(event, 1);
                    } else if (event.key === 'ArrowUp') {
                      moveOptionFocus(event, -1);
                    }
                  }}
                >
                  <Check
                    aria-hidden='true'
                    className={cn('size-4 shrink-0 text-primary', !selected && 'invisible')}
                  />
                  <span className='truncate'>{option.label}</span>
                </Button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
