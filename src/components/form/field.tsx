import { type ComponentProps, type ReactNode } from 'react';
import { type FieldError } from 'react-hook-form';
import { CircleAlert } from 'lucide-react';

import { RequiredMark } from '@/components/form/required-mark';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldFeedbackProps = {
  errors?: string[];
  hint?: string;
  id: string;
};

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2 sm:gap-2.5', className)} {...props} />;
}

export function FieldLabel({
  children,
  className,
  required,
  ...props
}: ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label className={cn('text-xs sm:text-sm', className)} {...props}>
      {children}
      <RequiredMark required={required} />
    </Label>
  );
}

export function FieldFeedback({ errors, hint, id }: FieldFeedbackProps) {
  if (errors?.length) {
    return (
      <div
        id={`${id}-error`}
        className='flex items-start gap-1.5 text-xs text-danger sm:gap-2 sm:text-sm'
        role='alert'
      >
        <CircleAlert aria-hidden='true' className='mt-0.5 size-3.5 shrink-0 sm:size-4' />
        <div>
          {errors.map((error, index) => (
            <p key={`${error}-${index}`}>{error}</p>
          ))}
        </div>
      </div>
    );
  }

  if (hint) {
    return (
      <p id={`${id}-hint`} className='text-xs text-muted-foreground'>
        {hint}
      </p>
    );
  }

  return null;
}

export function getFieldErrors(error?: FieldError, externalErrors?: string[]) {
  return error?.message ? [String(error.message)] : externalErrors;
}

export function getFieldDescriptionId(id: string, errors?: string[], hint?: ReactNode) {
  if (errors?.length) {
    return `${id}-error`;
  }

  return hint ? `${id}-hint` : undefined;
}

export const inputBaseClassName =
  'h-11 w-full border pr-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-2';

export const inputVariantClassNames = {
  default:
    'rounded-lg border-border bg-field focus:border-focus focus:ring-focus/20 sm:h-11 dark:bg-field',
  auth: 'rounded-2xl border-border bg-field focus:border-focus focus:ring-focus/20 sm:h-12 dark:bg-field',
} as const;

export type InputVariant = keyof typeof inputVariantClassNames;
