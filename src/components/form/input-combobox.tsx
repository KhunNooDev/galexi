'use client';

import { type KeyboardEvent, useId, useMemo, useRef, useState } from 'react';
import {
  type FieldError,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  get,
  useFormContext,
  useWatch,
} from 'react-hook-form';
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

export type ComboboxOption = {
  label: string;
  value: string;
};

export type InputComboboxProps<TValues extends FieldValues> = {
  className?: string;
  clearLabel?: string;
  errors?: string[];
  field: FieldPath<TValues>;
  hint?: string;
  id?: string;
  label: string;
  noResultsLabel: string;
  options: readonly ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  searchPlaceholder?: string;
  wrapperClassName?: string;
};

export function InputCombobox<TValues extends FieldValues>({
  className,
  clearLabel,
  errors: externalErrors,
  field,
  hint,
  id = field.replaceAll('.', '-'),
  label,
  noResultsLabel,
  options,
  placeholder,
  required = false,
  searchPlaceholder,
  wrapperClassName,
}: InputComboboxProps<TValues>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listboxId = useId();
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    control,
    formState: { errors },
    register,
    setValue,
  } = useFormContext<TValues>();
  const watchedValue = useWatch({ control, name: field });
  const value = typeof watchedValue === 'string' ? watchedValue : '';
  const fieldErrors = getFieldErrors(get(errors, field) as FieldError | undefined, externalErrors);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.value}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  function updateValue(nextValue: string) {
    setValue(field, nextValue as FieldPathValue<TValues, typeof field>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setOpen(false);
  }

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

  return (
    <Field className={wrapperClassName}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input type='hidden' {...register(field)} />
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
            id={id}
            type='button'
            variant='outline'
            aria-haspopup='listbox'
            aria-expanded={open}
            aria-invalid={Boolean(fieldErrors)}
            aria-required={required}
            aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
            className={cn(
              'h-11 w-full justify-between rounded-lg border-border bg-field px-3 text-left font-normal text-surface-foreground hover:bg-field sm:h-11 dark:bg-field',
              !value && 'text-muted-foreground',
              fieldErrors && 'border-danger/70 ring-2 ring-danger/10',
              className,
            )}
          >
            <span className='truncate'>{(selectedOption?.label ?? value) || placeholder}</span>
            <ChevronDown aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='w-(--radix-popover-trigger-width) p-2'
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
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
              className='h-10 rounded-lg border-border bg-field pr-3 pl-9 dark:bg-field'
              value={query}
              placeholder={searchPlaceholder ?? placeholder}
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
          <div
            ref={listboxRef}
            id={listboxId}
            role='listbox'
            className='mt-2 max-h-56 touch-pan-y scrollbar-gutter-stable overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'
          >
            {value && clearLabel && (
              <Button
                type='button'
                variant='ghost'
                role='option'
                aria-selected='false'
                className='h-auto w-full cursor-pointer justify-start rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-secondary-hover focus:bg-secondary-hover'
                onClick={() => updateValue('')}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    moveOptionFocus(event, 1);
                  } else if (event.key === 'ArrowUp') {
                    moveOptionFocus(event, -1);
                  }
                }}
              >
                <X aria-hidden='true' className='size-4 shrink-0' />
                {clearLabel}
              </Button>
            )}
            {filteredOptions.length === 0 ? (
              <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
                {noResultsLabel}
              </p>
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
                    className='h-auto w-full cursor-pointer justify-start rounded-lg px-3 py-2 text-left hover:bg-secondary-hover focus:bg-secondary-hover'
                    onClick={() => updateValue(option.value)}
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
