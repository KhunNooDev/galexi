'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
} from 'lucide-react';
import { z } from 'zod';

import type { AuthState } from '@/app/auth/actions';
import {
  AUTH_MODE,
  AUTH_PASSWORD_MIN_LENGTH,
  type AuthMode,
} from '@/constants/auth';
import { AUTH_ROUTES } from '@/constants/routes';

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

export function AuthForm({ action, mode }: AuthFormProps) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(action, {});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
  const {
    formState: { errors },
    handleSubmit,
    register,
    resetField,
  } = useForm<AuthFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(authFormSchema),
  });
  const Icon = mode === AUTH_MODE.SIGN_IN ? LogIn : UserPlus;
  const alternateHref =
    mode === AUTH_MODE.SIGN_IN ? AUTH_ROUTES.SIGN_UP : AUTH_ROUTES.SIGN_IN;
  const alternateLabel =
    mode === AUTH_MODE.SIGN_IN ? t('auth.signUp') : t('auth.signIn');
  const alternatePrompt =
    mode === AUTH_MODE.SIGN_IN ? t('auth.needAccount') : t('auth.haveAccount');
  const description =
    mode === AUTH_MODE.SIGN_IN
      ? t('auth.signInDescription')
      : t('auth.signUpDescription');
  const submitLabel =
    mode === AUTH_MODE.SIGN_IN ? t('auth.signIn') : t('auth.signUp');
  const title =
    mode === AUTH_MODE.SIGN_IN ? t('auth.signInTitle') : t('auth.signUpTitle');

  useEffect(() => {
    if (!state.success) return;

    resetField('password');
    resetField('confirmPassword');
  }, [resetField, state.success]);

  const emailErrors = errors.email?.message
    ? [errors.email.message]
    : state.fieldErrors?.email;
  const passwordErrors = errors.password?.message
    ? [errors.password.message]
    : state.fieldErrors?.password;
  const confirmationErrors = errors.confirmPassword?.message
    ? [errors.confirmPassword.message]
    : state.fieldErrors?.confirmPassword;

  const submitForm = handleSubmit((values) => {
    const formData = new FormData();
    formData.set('email', values.email);
    formData.set('password', values.password);
    if (mode === AUTH_MODE.SIGN_UP && values.confirmPassword !== undefined) {
      formData.set('confirmPassword', values.confirmPassword);
    }
    startTransition(() => formAction(formData));
  });

  return (
    <div className='w-full max-w-lg rounded-t-4xl border border-auth-field-border bg-auth-card p-4 shadow-[0_-16px_50px_rgb(90_67_115/12%)] backdrop-blur-xl sm:p-8 md:rounded-4xl md:p-10 md:shadow-[0_24px_80px_rgb(90_67_115/18%)]'>
      <nav
        className='mb-4 grid grid-cols-2 rounded-full border border-auth-field-border bg-auth-field p-1 sm:mb-8'
        aria-label={t('auth.navigationLabel')}
      >
        <Link
          href={AUTH_ROUTES.SIGN_IN}
          className={`rounded-full px-4 py-2 text-center text-sm font-medium transition-colors sm:py-2.5 ${
            mode === AUTH_MODE.SIGN_IN
              ? 'text-white shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground'
          }`}
          style={
            mode === AUTH_MODE.SIGN_IN
              ? { background: 'var(--auth-gradient)' }
              : {}
          }
          aria-current={mode === AUTH_MODE.SIGN_IN ? 'page' : undefined}
        >
          {t('auth.signIn')}
        </Link>
        <Link
          href={AUTH_ROUTES.SIGN_UP}
          className={`rounded-full px-4 py-2 text-center text-sm font-medium transition-colors sm:py-2.5 ${
            mode === AUTH_MODE.SIGN_UP
              ? 'text-white shadow-sm'
              : 'text-muted-foreground hover:text-surface-foreground'
          }`}
          style={
            mode === AUTH_MODE.SIGN_UP
              ? { background: 'var(--auth-gradient)' }
              : {}
          }
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

      <form
        action={formAction}
        className='flex flex-col gap-2 sm:gap-5'
        noValidate
        onSubmit={submitForm}
      >
        {state.error && (
          <p
            className='rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger'
            role='alert'
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            className='rounded-2xl border border-auth-field-border bg-auth-field px-4 py-3 text-sm text-surface-foreground'
            role='status'
          >
            {state.success}
          </p>
        )}

        <div className='flex flex-col gap-2 sm:gap-2.5'>
          <div className='flex flex-col gap-2 sm:gap-2.5'>
            <label className='text-xs font-medium sm:text-sm' htmlFor='email'>
              {t('auth.email')}
            </label>
            <div className='relative'>
              <Mail
                aria-hidden='true'
                className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground'
              />
              <input
                {...register('email')}
                id='email'
                type='email'
                autoComplete='email'
                required
                className={`h-11 w-full rounded-full border bg-auth-field pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-2 sm:h-13 ${
                  emailErrors
                    ? 'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20'
                    : 'border-auth-field-border focus:border-focus focus:ring-focus/20'
                }`}
                placeholder={t('auth.emailPlaceholder')}
                aria-invalid={Boolean(emailErrors)}
                aria-describedby={emailErrors ? 'email-error' : undefined}
              />
            </div>
          </div>
          {emailErrors && (
            <div
              id='email-error'
              className='flex items-start gap-1.5 text-xs text-danger sm:gap-2 sm:text-sm'
              role='alert'
            >
              <CircleAlert
                aria-hidden='true'
                className='mt-0.5 size-3.5 shrink-0 sm:size-4'
              />
              <div>
                {emailErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <PasswordField
          id='password'
          label={t('auth.password')}
          placeholder={
            mode === AUTH_MODE.SIGN_IN
              ? t('auth.passwordSignInPlaceholder')
              : t('auth.passwordPlaceholder', {
                  minLength: AUTH_PASSWORD_MIN_LENGTH,
                })
          }
          autoComplete={
            mode === AUTH_MODE.SIGN_IN ? 'current-password' : 'new-password'
          }
          error={passwordErrors}
          registration={register('password')}
          hideLabel={t('auth.hidePassword')}
          showLabel={t('auth.showPassword')}
          visible={showPassword}
          minLength={mode === AUTH_MODE.SIGN_UP ? AUTH_PASSWORD_MIN_LENGTH : 1}
          onToggle={() => setShowPassword((current) => !current)}
        />

        {mode === AUTH_MODE.SIGN_UP && (
          <PasswordField
            id='confirm-password'
            label={t('auth.confirmPassword')}
            placeholder={t('auth.passwordPlaceholder', {
              minLength: AUTH_PASSWORD_MIN_LENGTH,
            })}
            autoComplete='new-password'
            error={confirmationErrors}
            registration={register('confirmPassword')}
            hideLabel={t('auth.hidePassword')}
            showLabel={t('auth.showPassword')}
            visible={showConfirmation}
            minLength={AUTH_PASSWORD_MIN_LENGTH}
            onToggle={() => setShowConfirmation((current) => !current)}
          />
        )}

        <button
          type='submit'
          disabled={pending}
          className='mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 font-medium text-white shadow-[0_12px_28px_rgb(190_128_205/28%)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:h-13'
          style={{ background: 'var(--auth-gradient)' }}
        >
          <Icon aria-hidden='true' className='size-4' />
          {submitLabel}
        </button>
      </form>

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

type PasswordFieldProps = {
  autoComplete: 'current-password' | 'new-password';
  error?: string[];
  hideLabel: string;
  id: string;
  label: string;
  minLength: number;
  onToggle: () => void;
  placeholder: string;
  registration: UseFormRegisterReturn;
  showLabel: string;
  visible: boolean;
};

function PasswordField({
  autoComplete,
  error,
  hideLabel,
  id,
  label,
  minLength,
  onToggle,
  placeholder,
  registration,
  showLabel,
  visible,
}: PasswordFieldProps) {
  return (
    <div className='flex flex-col gap-2 sm:gap-2.5'>
      <div className='flex flex-col gap-2 sm:gap-2.5'>
        <label className='text-xs font-medium sm:text-sm' htmlFor={id}>
          {label}
        </label>
        <div className='relative'>
          <LockKeyhole
            aria-hidden='true'
            className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground'
          />
          <input
            {...registration}
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            minLength={minLength}
            required
            className={`h-11 w-full rounded-full border bg-auth-field pr-12 pl-11 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-2 sm:h-13 ${
              error
                ? 'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20'
                : 'border-auth-field-border focus:border-focus focus:ring-focus/20'
            }`}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <button
            type='button'
            className='absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-surface-foreground'
            aria-label={visible ? hideLabel : showLabel}
            onClick={onToggle}
          >
            {visible ? (
              <EyeOff aria-hidden='true' className='size-4' />
            ) : (
              <Eye aria-hidden='true' className='size-4' />
            )}
          </button>
        </div>
      </div>
      {error && (
        <div
          id={`${id}-error`}
          className='flex items-start gap-1.5 text-xs text-danger sm:gap-2 sm:text-sm'
          role='alert'
        >
          <CircleAlert
            aria-hidden='true'
            className='mt-0.5 size-3.5 shrink-0 sm:size-4'
          />
          <div>
            {error.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
