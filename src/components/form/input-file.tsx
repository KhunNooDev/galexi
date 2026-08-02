'use client';

import { type ChangeEvent, type ReactNode, useRef } from 'react';
import {
  type FieldError,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  get,
  useFormContext,
} from 'react-hook-form';
import { ImagePlus, X } from 'lucide-react';

import {
  Field,
  FieldFeedback,
  FieldLabel,
  getFieldDescriptionId,
  getFieldErrors,
} from '@/components/form/field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InputFileProps<TValues extends FieldValues> = {
  accept?: string;
  chooseLabel: string;
  className?: string;
  currentFileLabel?: string;
  description?: string;
  errors?: string[];
  field: FieldPath<TValues>;
  file?: File | null;
  formatsLabel?: string;
  hint?: string;
  id?: string;
  label: string;
  onFileChange: (file: File | null) => void;
  preview?: ReactNode;
  replaceLabel?: string;
  removeLabel: string;
  required?: boolean;
  wrapperClassName?: string;
};

export function InputFile<TValues extends FieldValues>({
  accept,
  chooseLabel,
  className,
  currentFileLabel,
  description,
  errors: externalErrors,
  field,
  file,
  formatsLabel,
  hint,
  id = field.replaceAll('.', '-'),
  label,
  onFileChange,
  preview,
  replaceLabel = chooseLabel,
  removeLabel,
  required = false,
  wrapperClassName,
}: InputFileProps<TValues>) {
  const {
    formState: { errors },
    register,
    setValue,
  } = useFormContext<TValues>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldErrors = getFieldErrors(get(errors, field) as FieldError | undefined, externalErrors);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.item(0) ?? null);
    event.target.value = '';
  }

  function removeFile() {
    onFileChange(null);
    setValue(field, '' as FieldPathValue<TValues, typeof field>, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <Field className={wrapperClassName}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input type='hidden' {...register(field)} />
      <input
        ref={inputRef}
        id={id}
        type='file'
        className='sr-only'
        accept={accept}
        aria-invalid={Boolean(fieldErrors)}
        aria-required={required}
        aria-describedby={getFieldDescriptionId(id, fieldErrors, hint)}
        onChange={selectFile}
      />

      <div
        className={cn(
          'rounded-2xl border border-border bg-field p-4 transition-colors',
          fieldErrors && 'border-danger/70 ring-2 ring-danger/10',
          className,
        )}
      >
        {preview ? (
          <div className='grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]'>
            <div className='relative aspect-square w-28 shrink-0 justify-self-center overflow-hidden rounded-2xl border border-border bg-secondary-hover shadow-sm sm:w-36 sm:justify-self-start [&>img]:absolute [&>img]:inset-0 [&>img]:size-full [&>img]:object-cover'>
              {preview}
            </div>
            <div className='min-w-0 text-center sm:text-left'>
              <p className='truncate text-sm font-semibold text-surface-foreground'>
                {file?.name ?? currentFileLabel}
              </p>
              {description && (
                <p className='mt-1 text-xs leading-5 text-muted-foreground'>{description}</p>
              )}
              {formatsLabel && (
                <p className='mt-1 text-xs leading-5 text-muted-foreground'>{formatsLabel}</p>
              )}
              <div className='mt-3 flex flex-wrap justify-center gap-2 sm:justify-start'>
                <Button
                  type='button'
                  variant='outline'
                  className='cursor-pointer rounded-lg border-border bg-background text-surface-foreground hover:bg-secondary-hover dark:bg-background dark:hover:bg-secondary-hover'
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus aria-hidden='true' className='size-4' />
                  {replaceLabel}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='cursor-pointer rounded-lg border-danger/30 bg-transparent text-danger hover:bg-danger/10 hover:text-danger dark:bg-transparent'
                  onClick={removeFile}
                >
                  <X aria-hidden='true' className='size-4' />
                  {removeLabel}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left'>
            <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
              <ImagePlus aria-hidden='true' className='size-5' />
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-surface-foreground'>{chooseLabel}</p>
              {formatsLabel && (
                <p className='mt-1 text-xs leading-5 text-muted-foreground'>{formatsLabel}</p>
              )}
            </div>
            <Button
              type='button'
              variant='outline'
              className='cursor-pointer rounded-lg border-border bg-background text-surface-foreground hover:bg-secondary-hover dark:bg-background dark:hover:bg-secondary-hover'
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden='true' className='size-4' />
              {chooseLabel}
            </Button>
          </div>
        )}
      </div>
      <FieldFeedback id={id} errors={fieldErrors} hint={hint} />
    </Field>
  );
}
