'use client';

import { type ComponentProps, type ReactNode } from 'react';
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
  inputBaseClassName,
  type InputVariant,
  inputVariantClassNames,
} from '@/components/form/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type InputTextProps<TValues extends FieldValues> = Omit<
  ComponentProps<typeof Input>,
  'name' | 'onBlur' | 'onChange' | 'ref'
> & {
  errors?: string[];
  field: FieldPath<TValues>;
  hint?: string;
  label: string;
  leadingIcon?: ReactNode;
  variant?: InputVariant;
  wrapperClassName?: string;
};

export function InputText<TValues extends FieldValues>({
  className,
  errors: externalErrors,
  field,
  hint,
  id = field.replaceAll('.', '-'),
  label,
  leadingIcon,
  required,
  variant = 'default',
  wrapperClassName,
  ...props
}: InputTextProps<TValues>) {
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
      <div className='relative'>
        {leadingIcon && (
          <span className='pointer-events-none absolute top-1/2 left-4 inline-flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground'>
            {leadingIcon}
          </span>
        )}
        <Input
          {...register(field)}
          {...props}
          id={id}
          required={required}
          className={cn(
            inputBaseClassName,
            inputVariantClassNames[variant],
            leadingIcon && 'pl-11',
            fieldErrors &&
              'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20',
            className,
          )}
          aria-invalid={Boolean(fieldErrors)}
          aria-describedby={
            getFieldDescriptionId(id, fieldErrors, hint) ?? props['aria-describedby']
          }
        />
      </div>
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
