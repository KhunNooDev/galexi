'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

function createSignInSchema(messages: {
  invalidEmail: string;
  passwordRequired: string;
}) {
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
      password: z.string().min(8, messages.passwordTooShort),
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

export async function signIn(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslations('auth.validation');
  const signInSchema = createSignInSchema({
    invalidEmail: t('invalidEmail'),
    passwordRequired: t('passwordRequired'),
  });
  const result = signInSchema.safeParse(getCredentials(formData));

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: t('incorrectCredentials') };
  }

  redirect('/tasks');
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslations('auth.validation');
  const signUpSchema = createSignUpSchema({
    confirmPassword: t('confirmPassword'),
    invalidEmail: t('invalidEmail'),
    passwordsMismatch: t('passwordsMismatch'),
    passwordTooShort: t('passwordTooShort'),
  });
  const result = signUpSchema.safeParse({
    ...getCredentials(formData),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'http://localhost:3000';
  const supabase = await createClient();
  const { email, password } = result.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL('/auth/callback', origin).toString(),
    },
  });

  if (error) {
    return { error: t('accountCreationFailed') };
  }

  if (!data.session) {
    return { success: t('checkEmail') };
  }

  redirect('/tasks');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
