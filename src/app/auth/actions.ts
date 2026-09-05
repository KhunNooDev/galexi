'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { AUTH_PASSWORD_MIN_LENGTH } from '@/constants/auth';
import type { PermanentIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { AUTH_ROUTES, getSafeAuthReturnTo, ROUTES } from '@/constants/routes';
import { hashLearningTransferToken } from '@/features/learning/account/account-transfer-token';
import { establishPermanentAccount } from '@/features/learning/account/server/account-membership.service';
import {
  consumeLearningAccountTransfer,
  prepareLearningAccountTransfer,
} from '@/features/learning/account/server/account-transfer.service';
import {
  clearLearningTransferCookie,
  getLearningTransferCookie,
  setLearningTransferCookie,
} from '@/features/learning/account/server/transfer-cookie';
import { getCurrentIdentity } from '@/lib/supabase/auth';
import {
  clearAuthSessionPersistence,
  createClient,
  setAuthSessionPersistence,
} from '@/lib/supabase/server';

async function redirectAfterAuthentication(
  identity: PermanentIdentity,
  returnTo?: string | null,
): Promise<never> {
  const safeReturnTo = getSafeAuthReturnTo(returnTo);

  if (safeReturnTo) {
    return redirect(safeReturnTo);
  }

  return redirect(
    identity.kind === IDENTITY_KIND.ADMIN ? ROUTES.MANAGE_WORDS : ROUTES.PUBLIC_WORDS,
  );
}

function createSignInSchema(messages: { invalidEmail: string; passwordRequired: string }) {
  return z.object({
    email: z.string().trim().pipe(z.email(messages.invalidEmail)),
    password: z.string().min(1, messages.passwordRequired),
    rememberMe: z.preprocess((value) => value === 'true', z.boolean()),
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

export async function signIn(
  returnTo: string | null,
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const t = await getTranslations();
  const signInSchema = createSignInSchema({
    invalidEmail: t('auth.validation.invalidEmail'),
    passwordRequired: t('auth.validation.passwordRequired'),
  });
  const result = signInSchema.safeParse({
    ...getCredentials(formData),
    rememberMe: formData.get('rememberMe'),
  });

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const [currentIdentity, transferToken] = await Promise.all([
    getCurrentIdentity(),
    getLearningTransferCookie(),
  ]);

  if (currentIdentity.kind === IDENTITY_KIND.GUEST) {
    if (!transferToken) {
      return { error: t('auth.validation.transferUnavailable') };
    }

    const preparation = await prepareLearningAccountTransfer(transferToken, currentIdentity.userId);

    if (preparation.status !== 'prepared') {
      await clearLearningTransferCookie();
      return { error: t('auth.validation.transferUnavailable') };
    }

    await setLearningTransferCookie(transferToken, preparation.expiresAt);
  } else if (transferToken) {
    await clearLearningTransferCookie();
  }

  const supabase = await createClient({ persistentSession: result.data.rememberMe });
  const { email, password, rememberMe } = result.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || data.user.is_anonymous) {
    return { error: t('auth.validation.incorrectCredentials') };
  }

  await setAuthSessionPersistence(rememberMe);

  if (transferToken && currentIdentity.kind === IDENTITY_KIND.GUEST) {
    let transferCompleted = false;

    try {
      const destination = await establishPermanentAccount(data.user);
      const transfer = await consumeLearningAccountTransfer(transferToken, destination);

      if (transfer.status === 'consumed' || transfer.status === 'already-consumed') {
        await clearLearningTransferCookie();
        transferCompleted = true;
      }

      if (transfer.status === 'expired' || transfer.status === 'invalid') {
        await clearLearningTransferCookie();
      }
    } catch {
      console.error('Learning account transfer failed after sign-in', {
        destinationUserId: data.user.id,
        transferTokenHash: hashLearningTransferToken(transferToken),
      });
    }

    redirect(
      transferCompleted
        ? `${ROUTES.LEARN_HOME}?saved=1`
        : `${ROUTES.LEARN_SAVE}?status=merge-failed`,
    );
  }

  const identity = await establishPermanentAccount(data.user);
  return redirectAfterAuthentication(identity, returnTo);
}

export async function signUp(
  returnTo: string | null,
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
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

  if (!data.user || data.user.is_anonymous) {
    return { error: t('auth.validation.accountCreationFailed') };
  }

  const identity = await establishPermanentAccount(data.user);
  return redirectAfterAuthentication(identity, returnTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearAuthSessionPersistence();
  redirect(AUTH_ROUTES.SIGN_IN);
}
