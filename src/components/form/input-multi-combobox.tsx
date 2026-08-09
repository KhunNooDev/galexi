'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { type FieldPath, type FieldValues, get, useFormContext, useWatch } from 'react-hook-form';
import { Check, ChevronDown, Search, X } from 'lucide-react';

import {
  Field,
  FieldFeedback,
  FieldLabel,
  getFieldDescriptionId,
  getFieldErrors,
} from '@/components/form/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiComboboxOption = { label: string; value: number };

export function InputMultiCombobox<TValues extends FieldValues>({
  field,
  hint,
  label,
  noResultsLabel,
  options,
  placeholder,
  removeLabel,
  searchPlaceholder,
  wrapperClassName,
}: {
  field: FieldPath<TValues>;
  hint?: string;
  label: string;
  noResultsLabel: string;
  options: readonly MultiComboboxOption[];
  placeholder: string;
  removeLabel: (label: string) => string;
  searchPlaceholder: string;
  wrapperClassName?: string;
}) {
  const id = field.replaceAll('.', '-');
  const listboxId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext<TValues>();
  const watchedValue = useWatch({ control, name: field });
  const value = Array.isArray(watchedValue) ? (watchedValue as number[]) : [];
  const fieldErrors = getFieldErrors(get(errors, field));
  const selected = options.filter((option) => value.includes(option.value));
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery))
      : options;
  }, [options, query]);

  function update(nextValue: number[]) {
    setValue(field, nextValue as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function toggle(optionValue: number) {
    update(
      value.includes(optionValue)
        ? value.filter((currentValue) => currentValue !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <Field className={wrapperClassName}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {selected.length > 0 && (
        <div className='flex flex-wrap gap-2' aria-label={label}>
          {selected.map((option) => (
            <span
              key={option.value}
              className='inline-flex items-center gap-1 rounded-full bg-primary/12 py-1 pr-1 pl-3 text-sm text-primary'
            >
              {option.label}
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='size-7 rounded-full hover:bg-primary/15'
                aria-label={removeLabel(option.label)}
                onClick={() => toggle(option.value)}
              >
                <X aria-hidden='true' className='size-3.5' />
              </Button>
            </span>
          ))}
        </div>
      )}
      <Popover
        modal
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type='button'
            variant='outline'
            aria-haspopup='listbox'
            aria-expanded={open}
            aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
            className={cn(
              'h-11 w-full justify-between rounded-lg border-border bg-field px-3 font-normal text-surface-foreground hover:bg-field dark:bg-field',
              selected.length === 0 && 'text-muted-foreground',
            )}
          >
            <span className='truncate'>{placeholder}</span>
            <ChevronDown aria-hidden='true' className='size-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='w-(--radix-popover-trigger-width) p-2'
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className='relative'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              ref={searchRef}
              value={query}
              className='h-10 bg-field pr-3 pl-9 dark:bg-field'
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            id={listboxId}
            role='listbox'
            aria-multiselectable='true'
            className='mt-2 max-h-56 touch-pan-y overflow-y-auto overscroll-contain'
          >
            {filteredOptions.length === 0 ? (
              <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
                {noResultsLabel}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <Button
                    key={option.value}
                    type='button'
                    variant='ghost'
                    role='option'
                    aria-selected={isSelected}
                    className='h-auto w-full justify-start rounded-lg px-3 py-2'
                    onClick={() => toggle(option.value)}
                  >
                    <Check
                      aria-hidden='true'
                      className={cn('size-4 text-primary', !isSelected && 'invisible')}
                    />
                    {option.label}
                  </Button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
