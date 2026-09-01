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
import { getAuthRoute } from '@/constants/routes';
import { cn } from '@/lib/utils';

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

type AuthFormValues = {
  confirmPassword?: string;
  email: string;
  password: string;
  rememberMe: boolean;
};

type AuthFormProps = {
  action: AuthAction;
  mode: AuthMode;
  returnTo?: string | null;
};

const { InputCheckbox, InputPass, InputText } = createFormInputs<AuthFormValues>();
const authSecretFields: ('password' | 'confirmPassword')[] = ['password', 'confirmPassword'];

export function AuthForm({ action, mode, returnTo }: AuthFormProps) {
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
          rememberMe: z.boolean(),
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
  const alternateHref = getAuthRoute(
    mode === AUTH_MODE.SIGN_IN ? AUTH_MODE.SIGN_UP : AUTH_MODE.SIGN_IN,
    returnTo,
  );
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
    if (mode === AUTH_MODE.SIGN_IN && values.rememberMe) {
      formData.set('rememberMe', 'true');
    }
    if (mode === AUTH_MODE.SIGN_UP && values.confirmPassword !== undefined) {
      formData.set('confirmPassword', values.confirmPassword);
    }
    startTransition(() => formAction(formData));
  };

  return (
    <div
      className={cn(
        'w-full max-w-lg animate-in rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_80px_rgb(34_74_150/10%)] ease-out animation-duration-300 fill-mode-both fade-in motion-reduce:animate-none sm:p-8 lg:p-9',
        mode === AUTH_MODE.SIGN_IN ? 'slide-in-from-left-3' : 'slide-in-from-right-3',
      )}
    >
      <nav
        className='mb-7 grid grid-cols-2 rounded-2xl border border-border bg-field p-1'
        aria-label={t('auth.navigationLabel')}
      >
        <Link
          href={getAuthRoute(AUTH_MODE.SIGN_IN, returnTo)}
          scroll={false}
          className={cn(
            'rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all duration-300',
            mode === AUTH_MODE.SIGN_IN
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground',
          )}
          aria-current={mode === AUTH_MODE.SIGN_IN ? 'page' : undefined}
        >
          {t('auth.signIn')}
        </Link>
        <Link
          href={getAuthRoute(AUTH_MODE.SIGN_UP, returnTo)}
          scroll={false}
          className={cn(
            'rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all duration-300',
            mode === AUTH_MODE.SIGN_UP
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground',
          )}
          aria-current={mode === AUTH_MODE.SIGN_UP ? 'page' : undefined}
        >
          {t('auth.signUp')}
        </Link>
      </nav>

      <div className='mb-7 space-y-2'>
        <h2 className='text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
          {title}
        </h2>
        <p className='max-w-sm text-sm leading-6 text-muted-foreground sm:text-base'>
          {description}
        </p>
      </div>

      <Form
        action={formAction}
        className='flex flex-col gap-4'
        defaultValues={{ confirmPassword: '', email: '', password: '', rememberMe: false }}
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
            className='rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-surface-foreground'
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

        {mode === AUTH_MODE.SIGN_IN && (
          <InputCheckbox
            field='rememberMe'
            label={t('auth.rememberMe')}
            hint={t('auth.rememberMeHint')}
            variant='inline'
          />
        )}

        <Button
          type='submit'
          disabled={pending}
          className='mt-2 h-12 w-full cursor-pointer rounded-2xl bg-primary px-4 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-wait sm:h-13'
        >
          <Icon aria-hidden='true' className='size-4' />
          {submitLabel}
        </Button>
      </Form>

      <p className='mt-6 text-center text-xs text-muted-foreground sm:text-sm'>
        {alternatePrompt}{' '}
        <Link
          href={alternateHref}
          className='font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-current'
        >
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
