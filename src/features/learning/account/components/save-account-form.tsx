'use client';

import { startTransition, useActionState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CircleAlert, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { z } from 'zod';

import type { SaveAccountState } from '@/app/learn/save/actions';
import { createFormInputs, Form } from '@/components/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AUTH_PASSWORD_MIN_LENGTH } from '@/constants/auth';
import {
  createAccountEmailSchema,
  createAccountPasswordSchema,
} from '@/features/learning/account/account.schema';

type SaveAccountFormValues = {
  confirmPassword?: string;
  email?: string;
  password?: string;
};

type SaveAccountFormProps = {
  action: (state: SaveAccountState, formData: FormData) => Promise<SaveAccountState>;
  kind: 'email' | 'password';
};

const { InputPass, InputText } = createFormInputs<SaveAccountFormValues>();

export function SaveAccountForm({ action, kind }: SaveAccountFormProps) {
  const t = useTranslations('learning.saveAccount');
  const [state, formAction, pending] = useActionState(action, {});
  const schema = useMemo<z.ZodType<SaveAccountFormValues, SaveAccountFormValues>>(
    () =>
      kind === 'email'
        ? createAccountEmailSchema(t('validation.invalidEmail'))
        : createAccountPasswordSchema({
            confirmPassword: t('validation.confirmPassword'),
            passwordsMismatch: t('validation.passwordsMismatch'),
            passwordTooShort: t('validation.passwordTooShort', {
              minLength: AUTH_PASSWORD_MIN_LENGTH,
            }),
          }),
    [kind, t],
  );

  function submit(values: SaveAccountFormValues) {
    const formData = new FormData();
    if (values.email !== undefined) formData.set('email', values.email);
    if (values.password !== undefined) formData.set('password', values.password);
    if (values.confirmPassword !== undefined) {
      formData.set('confirmPassword', values.confirmPassword);
    }
    startTransition(() => formAction(formData));
  }

  return (
    <Form
      action={formAction}
      className='flex flex-col gap-4'
      defaultValues={{ confirmPassword: '', email: '', password: '' }}
      schema={schema}
      onSubmit={submit}
    >
      {state.error && (
        <Alert variant='destructive' className='rounded-2xl border-danger/30 bg-danger/10'>
          <CircleAlert aria-hidden='true' />
          <AlertDescription className='text-danger'>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert className='rounded-2xl border-primary/25 bg-primary/8' role='status'>
          <Mail aria-hidden='true' />
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      {kind === 'email' ? (
        <InputText
          field='email'
          label={t('emailLabel')}
          type='email'
          required
          errors={state.fieldErrors?.email}
          leadingIcon={<Mail aria-hidden='true' className='size-4' />}
          placeholder={t('emailPlaceholder')}
          variant='auth'
        />
      ) : (
        <>
          <InputPass
            field='password'
            label={t('passwordLabel')}
            placeholder={t('passwordPlaceholder', { minLength: AUTH_PASSWORD_MIN_LENGTH })}
            errors={state.fieldErrors?.password}
            hideLabel={t('hidePassword')}
            showLabel={t('showPassword')}
            leadingIcon={<LockKeyhole aria-hidden='true' className='size-4' />}
            minLength={AUTH_PASSWORD_MIN_LENGTH}
            required
            variant='auth'
          />
          <InputPass
            field='confirmPassword'
            label={t('confirmPasswordLabel')}
            placeholder={t('passwordPlaceholder', { minLength: AUTH_PASSWORD_MIN_LENGTH })}
            errors={state.fieldErrors?.confirmPassword}
            hideLabel={t('hidePassword')}
            showLabel={t('showPassword')}
            leadingIcon={<LockKeyhole aria-hidden='true' className='size-4' />}
            minLength={AUTH_PASSWORD_MIN_LENGTH}
            required
            variant='auth'
          />
        </>
      )}

      <Button
        type='submit'
        className='h-12 w-full rounded-2xl shadow-lg shadow-primary/20'
        disabled={pending || Boolean(state.success)}
      >
        <UserPlus aria-hidden='true' />
        {pending ? t('saving') : kind === 'email' ? t('sendVerification') : t('saveProgress')}
      </Button>
    </Form>
  );
}
