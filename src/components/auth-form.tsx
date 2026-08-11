'use client';

import { startTransition, useActionState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CircleAlert, LockKeyhole, LogIn, Mail, UserPlus } from 'lucide-react';
import { z } from 'zod';

import type { AuthState } from '@/app/auth/actions';
import { createFormInputs, Form, FormResetFields } from '@/components/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AUTH_MODE, AUTH_PASSWORD_MIN_LENGTH, type AuthMode } from '@/constants/auth';
import { AUTH_ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

type AuthFormValues = {
  confirmPassword?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  action: AuthAction;
  mode: AuthMode;
};

const { InputPass, InputText } = createFormInputs<AuthFormValues>();
const authSecretFields: ('password' | 'confirmPassword')[] = ['password', 'confirmPassword'];

export function AuthForm({ action, mode }: AuthFormProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(action, {});
  const authFormSchema = useMemo(
    () =>
      z
        .object({
          email: z
            .string()
            .trim()
            .pipe(z.email(t('auth.validation.invalidEmail'))),
          password:
            mode === AUTH_MODE.SIGN_IN
              ? z.string().min(1, t('auth.validation.passwordRequired'))
              : z.string().min(
                  AUTH_PASSWORD_MIN_LENGTH,
                  t('auth.validation.passwordTooShort', {
                    minLength: AUTH_PASSWORD_MIN_LENGTH,
                  }),
                ),
          confirmPassword: z.string().optional(),
        })
        .superRefine(({ confirmPassword, password }, context) => {
          if (mode !== AUTH_MODE.SIGN_UP) return;

          if (!confirmPassword) {
            context.addIssue({
              code: 'custom',
              message: t('auth.validation.confirmPassword'),
              path: ['confirmPassword'],
            });
            return;
          }

          if (confirmPassword !== password) {
            context.addIssue({
              code: 'custom',
              message: t('auth.validation.passwordsMismatch'),
              path: ['confirmPassword'],
            });
          }
        }),
    [mode, t],
  );
  const Icon = mode === AUTH_MODE.SIGN_IN ? LogIn : UserPlus;
  const alternateHref = mode === AUTH_MODE.SIGN_IN ? AUTH_ROUTES.SIGN_UP : AUTH_ROUTES.SIGN_IN;
  const alternateLabel = mode === AUTH_MODE.SIGN_IN ? t('auth.signUp') : t('auth.signIn');
  const alternatePrompt =
    mode === AUTH_MODE.SIGN_IN ? t('auth.needAccount') : t('auth.haveAccount');
  const description =
    mode === AUTH_MODE.SIGN_IN ? t('auth.signInDescription') : t('auth.signUpDescription');
  const submitLabel = mode === AUTH_MODE.SIGN_IN ? t('auth.signIn') : t('auth.signUp');
  const title = mode === AUTH_MODE.SIGN_IN ? t('auth.signInTitle') : t('auth.signUpTitle');

  const submitForm = (values: AuthFormValues) => {
    const formData = new FormData();
    formData.set('email', values.email);
    formData.set('password', values.password);
    if (mode === AUTH_MODE.SIGN_UP && values.confirmPassword !== undefined) {
      formData.set('confirmPassword', values.confirmPassword);
    }
    startTransition(() => formAction(formData));
  };

  return (
    <div
      className={cn(
        'mx-3 w-[calc(100%-1.5rem)] max-w-lg animate-in rounded-t-4xl border border-auth-field-border bg-auth-card p-5 shadow-[0_-16px_50px_rgb(34_74_150/16%)] ease-out animation-duration-300 fill-mode-both fade-in motion-reduce:animate-none sm:mx-6 sm:w-[calc(100%-3rem)] sm:p-8 md:mx-0 md:w-full md:rounded-4xl md:p-10 md:shadow-[0_24px_80px_rgb(34_74_150/18%)]',
        mode === AUTH_MODE.SIGN_IN ? 'slide-in-from-left-3' : 'slide-in-from-right-3',
      )}
    >
      <nav
        className='mb-5 grid grid-cols-2 rounded-2xl border border-auth-field-border bg-auth-field p-1 sm:mb-8'
        aria-label={t('auth.navigationLabel')}
      >
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          scroll={false}
          className={cn(
            'rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all duration-300',
            mode === AUTH_MODE.SIGN_IN
              ? 'text-white shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground',
          )}
          style={mode === AUTH_MODE.SIGN_IN ? { background: 'var(--auth-gradient)' } : {}}
          aria-current={mode === AUTH_MODE.SIGN_IN ? 'page' : undefined}
        >
          {t('auth.signIn')}
        </Link>
        <Link
          href={AUTH_ROUTES.SIGN_UP}
          scroll={false}
          className={cn(
            'rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all duration-300',
            mode === AUTH_MODE.SIGN_UP
              ? 'text-white shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground',
          )}
          style={mode === AUTH_MODE.SIGN_UP ? { background: 'var(--auth-gradient)' } : {}}
          aria-current={mode === AUTH_MODE.SIGN_UP ? 'page' : undefined}
        >
          {t('auth.signUp')}
        </Link>
      </nav>

      <div className='mb-4 space-y-2 text-center sm:mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
          {title}
        </h1>
        <p className='mx-auto hidden max-w-sm text-sm leading-6 text-muted-foreground sm:block sm:text-base'>
          {description}
        </p>
      </div>

      <Form
        action={formAction}
        className='flex flex-col gap-2 sm:gap-5'
        defaultValues={{ confirmPassword: '', email: '', password: '' }}
        schema={authFormSchema}
        onSubmit={submitForm}
      >
        <FormResetFields<AuthFormValues>
          fields={authSecretFields}
          when={state.success ? state : null}
        />
        {state.error && (
          <Alert
            variant='destructive'
            className='rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
          >
            <CircleAlert aria-hidden='true' />
            <AlertDescription className='text-danger'>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert
            className='rounded-2xl border border-auth-field-border bg-auth-field px-4 py-3 text-sm text-surface-foreground'
            role='status'
          >
            <AlertDescription className='text-surface-foreground'>{state.success}</AlertDescription>
          </Alert>
        )}

        <InputText
          field='email'
          label={t('auth.email')}
          type='email'
          required
          errors={state.fieldErrors?.email}
          leadingIcon={<Mail aria-hidden='true' className='size-4' />}
          placeholder={t('auth.emailPlaceholder')}
          variant='auth'
        />

        <InputPass
          field='password'
          label={t('auth.password')}
          placeholder={
            mode === AUTH_MODE.SIGN_IN
              ? t('auth.passwordSignInPlaceholder')
              : t('auth.passwordPlaceholder', {
                  minLength: AUTH_PASSWORD_MIN_LENGTH,
                })
          }
          errors={state.fieldErrors?.password}
          hideLabel={t('auth.hidePassword')}
          showLabel={t('auth.showPassword')}
          leadingIcon={<LockKeyhole aria-hidden='true' className='size-4' />}
          minLength={mode === AUTH_MODE.SIGN_UP ? AUTH_PASSWORD_MIN_LENGTH : 1}
          required
          variant='auth'
        />

        {mode === AUTH_MODE.SIGN_UP && (
          <InputPass
            field='confirmPassword'
            label={t('auth.confirmPassword')}
            placeholder={t('auth.passwordPlaceholder', {
              minLength: AUTH_PASSWORD_MIN_LENGTH,
            })}
            errors={state.fieldErrors?.confirmPassword}
            hideLabel={t('auth.hidePassword')}
            showLabel={t('auth.showPassword')}
            leadingIcon={<LockKeyhole aria-hidden='true' className='size-4' />}
            minLength={AUTH_PASSWORD_MIN_LENGTH}
            required
            variant='auth'
          />
        )}

        <Button
          type='submit'
          disabled={pending}
          className='mt-4 h-12 w-full cursor-pointer rounded-2xl px-4 font-medium text-white shadow-[0_12px_28px_rgb(34_74_150/24%)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait sm:h-13'
          style={{ background: 'var(--auth-gradient)' }}
        >
          <Icon aria-hidden='true' className='size-4' />
          {submitLabel}
        </Button>
      </Form>

      <p className='mt-4 text-center text-xs text-muted-foreground sm:mt-7 sm:text-sm'>
        {alternatePrompt}{' '}
        <Link
          href={alternateHref}
          className='font-medium text-surface-foreground underline decoration-auth-field-border underline-offset-4 hover:decoration-current'
        >
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
