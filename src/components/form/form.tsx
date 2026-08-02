'use client';

import { type ComponentProps, type ReactNode, useEffect, useRef } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  FormProvider,
  type Path,
  useForm,
  useFormContext,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type BaseFormProps<TOutput extends FieldValues> = Omit<ComponentProps<'form'>, 'onSubmit'> & {
  children: ReactNode;
  onSubmit: (values: TOutput) => Promise<void> | void;
};

type SchemaFormProps<
  TInput extends FieldValues,
  TOutput extends FieldValues,
> = BaseFormProps<TOutput> & {
  defaultValues?: DefaultValues<TInput>;
  form?: never;
  schema: z.ZodType<TOutput, TInput>;
};

type ExistingFormProps<
  TInput extends FieldValues,
  TOutput extends FieldValues,
> = BaseFormProps<TOutput> & {
  defaultValues?: never;
  form: UseFormReturn<TInput, unknown, TOutput>;
  schema?: never;
};

type FormProps<TInput extends FieldValues, TOutput extends FieldValues> =
  SchemaFormProps<TInput, TOutput> | ExistingFormProps<TInput, TOutput>;

type FormElementProps<
  TInput extends FieldValues,
  TOutput extends FieldValues,
> = BaseFormProps<TOutput> & {
  form: UseFormReturn<TInput, unknown, TOutput>;
};

function FormElement<TInput extends FieldValues, TOutput extends FieldValues>({
  autoComplete = 'off',
  children,
  form,
  noValidate = true,
  onSubmit,
  ...props
}: FormElementProps<TInput, TOutput>) {
  return (
    <FormProvider {...form}>
      <form
        {...props}
        autoComplete={autoComplete}
        noValidate={noValidate}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {children}
      </form>
    </FormProvider>
  );
}

function SchemaForm<TInput extends FieldValues, TOutput extends FieldValues>({
  defaultValues,
  schema,
  ...props
}: SchemaFormProps<TInput, TOutput>) {
  const form = useForm<TInput, unknown, TOutput>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  return <FormElement {...props} form={form} />;
}

export function Form<TInput extends FieldValues, TOutput extends FieldValues>(
  props: FormProps<TInput, TOutput>,
) {
  if ('form' in props && props.form) {
    return <FormElement {...props} form={props.form} />;
  }

  return <SchemaForm {...props} />;
}

export function FormResetFields<TValues extends FieldValues>({
  fields,
  when,
}: {
  fields: Path<TValues>[];
  when: unknown;
}) {
  const { resetField } = useFormContext<TValues>();
  const previousValue = useRef(when);

  useEffect(() => {
    if (!when || Object.is(previousValue.current, when)) {
      previousValue.current = when;
      return;
    }

    fields.forEach((field) => resetField(field));
    previousValue.current = when;
  }, [fields, resetField, when]);

  return null;
}
