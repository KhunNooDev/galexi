'use client';

import { type ComponentProps } from 'react';
import {
  type FieldError,
  type FieldPath,
  type FieldValues,
  get,
  useFormContext,
} from 'react-hook-form';

import {
  Field,
  FieldFeedback,
  FieldLabel,
  getFieldDescriptionId,
  getFieldErrors,
} from '@/components/form/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InputTextareaProps<TValues extends FieldValues> = Omit<
  ComponentProps<typeof Textarea>,
  'name' | 'onBlur' | 'onChange' | 'ref'
> & {
  errors?: string[];
  field: FieldPath<TValues>;
  hint?: string;
  label: string;
  wrapperClassName?: string;
};

export function InputTextarea<TValues extends FieldValues>({
  className,
  errors: externalErrors,
  field,
  hint,
  id = field.replaceAll('.', '-'),
  label,
  required,
  wrapperClassName,
  ...props
}: InputTextareaProps<TValues>) {
  const {
    formState: { errors },
    register,
  } = useFormContext<TValues>();
  const fieldErrors = getFieldErrors(get(errors, field) as FieldError | undefined, externalErrors);

  return (
    <Field className={wrapperClassName}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Textarea
        {...register(field)}
        {...props}
        id={id}
        required={required}
        className={cn(
          'min-h-24 w-full resize-y rounded-lg border border-border bg-field px-3 py-2 text-surface-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus/20 dark:bg-field',
          fieldErrors &&
            'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20',
          className,
        )}
        aria-invalid={Boolean(fieldErrors)}
        aria-describedby={getFieldDescriptionId(id, fieldErrors, hint) ?? props['aria-describedby']}
      />
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
