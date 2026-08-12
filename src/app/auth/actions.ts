'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { AUTH_PASSWORD_MIN_LENGTH } from '@/constants/auth';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { createClient } from '@/lib/supabase/server';

function createSignInSchema(messages: { invalidEmail: string; passwordRequired: string }) {
  return z.object({
    email: z.string().trim().pipe(z.email(messages.invalidEmail)),
    password: z.string().min(1, messages.passwordRequired),
  });
}

function createSignUpSchema(messages: {
  confirmPassword: string;
  invalidEmail: string;
  passwordsMismatch: string;
  passwordTooShort: string;
}) {
  return z
    .object({
      email: z.string().trim().pipe(z.email(messages.invalidEmail)),
      password: z.string().min(AUTH_PASSWORD_MIN_LENGTH, messages.passwordTooShort),
      confirmPassword: z.string().min(1, messages.confirmPassword),
    })
    .refine(({ confirmPassword, password }) => confirmPassword === password, {
      message: messages.passwordsMismatch,
      path: ['confirmPassword'],
    });
}

export type AuthState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

function getCredentials(formData: FormData) {
  return {
    email: formData.get('email'),
    password: formData.get('password'),
  };
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations();
  const signInSchema = createSignInSchema({
    invalidEmail: t('auth.validation.invalidEmail'),
    passwordRequired: t('auth.validation.passwordRequired'),
  });
  const result = signInSchema.safeParse(getCredentials(formData));

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: t('auth.validation.incorrectCredentials') };
  }

  redirect(ROUTES.MANAGE_WORDS);
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations();
  const signUpSchema = createSignUpSchema({
    confirmPassword: t('auth.validation.confirmPassword'),
    invalidEmail: t('auth.validation.invalidEmail'),
    passwordsMismatch: t('auth.validation.passwordsMismatch'),
    passwordTooShort: t('auth.validation.passwordTooShort', {
      minLength: AUTH_PASSWORD_MIN_LENGTH,
    }),
  });
  const result = signUpSchema.safeParse({
    ...getCredentials(formData),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'http://localhost:3000';
  const supabase = await createClient();
  const { email, password } = result.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL(ROUTES.AUTH_CALLBACK, origin).toString(),
    },
  });

  if (error) {
    return { error: t('auth.validation.accountCreationFailed') };
  }

  if (!data.session) {
    return { success: t('auth.validation.checkEmail') };
  }

  redirect(ROUTES.MANAGE_WORDS);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_ROUTES.SIGN_IN);
}
