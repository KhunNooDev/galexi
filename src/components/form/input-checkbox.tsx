'use client';

import { type ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import {
  Field,
  FieldFeedback,
  getFieldDescriptionId,
  getFieldErrors,
} from '@/components/form/field';
import { RequiredMark } from '@/components/form/required-mark';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type InputCheckboxProps<TValues extends FieldValues> = {
  className?: string;
  errors?: string[];
  field: FieldPath<TValues>;
  hint?: string;
  icon?: ReactNode;
  id?: string;
  label: string;
  onValueChange?: (checked: boolean) => void;
  required?: boolean;
  variant?: 'card' | 'inline';
  wrapperClassName?: string;
};

export function InputCheckbox<TValues extends FieldValues>({
  className,
  errors: externalErrors,
  field,
  hint,
  icon,
  id = field.replaceAll('.', '-'),
  label,
  onValueChange,
  required = false,
  variant = 'card',
  wrapperClassName,
}: InputCheckboxProps<TValues>) {
  const { control } = useFormContext<TValues>();

  return (
    <Controller
      control={control}
      name={field}
      render={({ field: controller, fieldState }) => {
        const fieldErrors = getFieldErrors(fieldState.error, externalErrors);

        return (
          <Field className={wrapperClassName}>
            <Label
              htmlFor={id}
              className={cn(
                'group flex cursor-pointer items-start gap-3 transition-colors',
                variant === 'card'
                  ? 'rounded-xl border border-border bg-field p-4 focus-within:ring-2 focus-within:ring-focus/20 hover:border-primary/40 hover:bg-primary/5'
                  : 'rounded-lg py-1 text-muted-foreground hover:text-surface-foreground',
                controller.value &&
                  (variant === 'card'
                    ? 'border-primary/50 bg-primary/5'
                    : 'text-surface-foreground'),
                fieldErrors && variant === 'card' && 'border-danger/70 ring-2 ring-danger/10',
              )}
            >
              <Checkbox
                ref={controller.ref}
                id={id}
                name={controller.name}
                checked={Boolean(controller.value)}
                className={cn(
                  'mt-0.5 size-5 border-muted-foreground/60 bg-background shadow-none',
                  className,
                )}
                aria-invalid={Boolean(fieldErrors)}
                aria-required={required}
                aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
                onBlur={controller.onBlur}
                onCheckedChange={(checked) => {
                  const nextChecked = checked === true;
                  controller.onChange(nextChecked);
                  onValueChange?.(nextChecked);
                }}
              />
              <span className='grid min-w-0 flex-1 gap-1'>
                <span
                  className={cn(
                    'text-sm font-medium',
                    variant === 'card' ? 'text-surface-foreground' : 'text-current',
                  )}
                >
                  {label}
                  <RequiredMark required={required} />
                </span>
                {hint && !fieldErrors && (
                  <span id={`${id}-hint`} className='text-xs leading-5 text-muted-foreground'>
                    {hint}
                  </span>
                )}
              </span>
              {icon && (
                <span
                  aria-hidden='true'
                  className={cn(
                    'mt-0.5 text-muted-foreground transition-colors group-hover:text-primary',
                    controller.value && 'text-primary',
                  )}
                >
                  {icon}
                </span>
              )}
            </Label>
            <FieldFeedback id={id} errors={fieldErrors} />
          </Field>
        );
      }}
    />
  );
}
