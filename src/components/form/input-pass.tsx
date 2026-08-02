'use client';

import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  type FieldError,
  type FieldPath,
  type FieldValues,
  get,
  useFormContext,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type InputPassProps<TValues extends FieldValues> = Omit<
  ComponentProps<typeof Input>,
  'name' | 'onBlur' | 'onChange' | 'ref' | 'type'
> & {
  errors?: string[];
  field: FieldPath<TValues>;
  hideLabel?: string;
  hint?: string;
  label: string;
  leadingIcon?: ReactNode;
  showLabel?: string;
  variant?: InputVariant;
  wrapperClassName?: string;
};

export function InputPass<TValues extends FieldValues>({
  className,
  errors: externalErrors,
  field,
  hideLabel = 'Hide password',
  hint,
  id = field.replaceAll('.', '-'),
  label,
  leadingIcon,
  required,
  showLabel = 'Show password',
  variant = 'default',
  wrapperClassName,
  ...props
}: InputPassProps<TValues>) {
  const [visible, setVisible] = useState(false);
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
          type={visible ? 'text' : 'password'}
          required={required}
          className={cn(
            inputBaseClassName,
            inputVariantClassNames[variant],
            'pr-12',
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
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full text-muted-foreground hover:bg-secondary-hover hover:text-surface-foreground'
          aria-label={visible ? hideLabel : showLabel}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff aria-hidden='true' className='size-4' />
          ) : (
            <Eye aria-hidden='true' className='size-4' />
          )}
        </Button>
      </div>
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
