'use client';

import { useState } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

import {
  Field,
  FieldFeedback,
  FieldLabel,
  getFieldDescriptionId,
  getFieldErrors,
} from '@/components/form/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type InputTagsProps<TValues extends FieldValues> = {
  addLabel: string;
  className?: string;
  errors?: string[];
  field: FieldPath<TValues>;
  hint?: string;
  id?: string;
  label: string;
  maxItems?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  removeLabel: (value: string) => string;
  wrapperClassName?: string;
};

export function InputTags<TValues extends FieldValues>({
  addLabel,
  className,
  errors: externalErrors,
  field,
  hint,
  id = field.replaceAll('.', '-'),
  label,
  maxItems = Number.POSITIVE_INFINITY,
  maxLength,
  placeholder,
  required = false,
  removeLabel,
  wrapperClassName,
}: InputTagsProps<TValues>) {
  const [draft, setDraft] = useState('');
  const { control } = useFormContext<TValues>();
  const { field: controller, fieldState } = useController({ control, name: field });
  const values = Array.isArray(controller.value) ? (controller.value as string[]) : [];
  const fieldErrors = getFieldErrors(fieldState.error, externalErrors);

  function addValue() {
    const value = draft.trim();

    if (!value || values.includes(value) || values.length >= maxItems) {
      return;
    }

    controller.onChange([...values, value]);
    setDraft('');
  }

  return (
    <Field className={wrapperClassName}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border bg-field p-2 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/20',
          fieldErrors && 'border-danger/70 ring-2 ring-danger/10',
          className,
        )}
        aria-invalid={Boolean(fieldErrors)}
        aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
      >
        {values.map((value) => (
          <Badge key={value} className='gap-1 bg-primary/12 px-3 py-1 text-sm text-primary'>
            {value}
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              className='size-5 cursor-pointer rounded-full p-0.5 text-primary hover:bg-primary/15 hover:text-primary'
              aria-label={removeLabel(value)}
              onClick={() => controller.onChange(values.filter((item) => item !== value))}
            >
              <X aria-hidden='true' className='size-3.5' />
            </Button>
          </Badge>
        ))}
        <Input
          id={id}
          className='h-7 min-w-40 flex-1 border-0 bg-transparent px-1 text-sm text-surface-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent'
          value={draft}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={Boolean(fieldErrors)}
          aria-required={required}
          aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
          onBlur={controller.onBlur}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addValue();
            }
          }}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className='size-7 cursor-pointer rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
          aria-label={addLabel}
          disabled={!draft.trim() || values.length >= maxItems}
          onClick={addValue}
        >
          <Plus aria-hidden='true' className='size-4' />
        </Button>
      </div>
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
