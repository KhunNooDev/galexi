'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { AUTH_MODE } from '@/constants/auth';
import { AUTH_PASSWORD_MIN_LENGTH } from '@/constants/auth';
import { IDENTITY_KIND } from '@/constants/identity';
import { getAuthRoute, ROUTES } from '@/constants/routes';
import {
  createAccountEmailSchema,
  createAccountPasswordSchema,
} from '@/features/learning/account/account.schema';
import { hashLearningTransferToken } from '@/features/learning/account/account-transfer-token';
import { establishPermanentAccount } from '@/features/learning/account/server/account-membership.service';
import {
  completeSameUserAccountTransfer,
  consumeLearningAccountTransfer,
  createLearningAccountTransfer,
  prepareLearningAccountTransfer,
} from '@/features/learning/account/server/account-transfer.service';
import {
  clearLearningTransferCookie,
  getLearningTransferCookie,
  setLearningTransferCookie,
} from '@/features/learning/account/server/transfer-cookie';
import { getCurrentIdentity } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export type SaveAccountState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    confirmPassword?: string[];
    email?: string[];
    password?: string[];
  };
};

export async function requestAccountUpgrade(
  _state: SaveAccountState,
  formData: FormData,
): Promise<SaveAccountState> {
  const [identity, t] = await Promise.all([
    getCurrentIdentity(),
    getTranslations('learning.saveAccount'),
  ]);

  if (identity.kind !== IDENTITY_KIND.GUEST) {
    redirect(ROUTES.LEARN_HOME);
  }

  const result = createAccountEmailSchema(t('validation.invalidEmail')).safeParse({
    email: formData.get('email'),
  });

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'http://localhost:3000';
  const callbackUrl = new URL(ROUTES.AUTH_CALLBACK, origin);
  callbackUrl.searchParams.set('next', `${ROUTES.LEARN_SAVE}?step=password`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser(
    { email: result.data.email },
    { emailRedirectTo: callbackUrl.toString() },
  );

  if (error || !data.user) {
    return { error: t('validation.emailUnavailable') };
  }

  const transfer = await createLearningAccountTransfer(identity);
  await setLearningTransferCookie(transfer.token, transfer.expiresAt);

  if (!data.user.is_anonymous) {
    redirect(`${ROUTES.LEARN_SAVE}?step=password`);
  }

  return { success: t('checkEmail', { email: result.data.email }) };
}

export async function completeAccountUpgrade(
  _state: SaveAccountState,
  formData: FormData,
): Promise<SaveAccountState> {
  const t = await getTranslations('learning.saveAccount');
  const result = createAccountPasswordSchema({
    confirmPassword: t('validation.confirmPassword'),
    passwordsMismatch: t('validation.passwordsMismatch'),
    passwordTooShort: t('validation.passwordTooShort', {
      minLength: AUTH_PASSWORD_MIN_LENGTH,
    }),
  }).safeParse({
    confirmPassword: formData.get('confirmPassword'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { fieldErrors: z.flattenError(result.error).fieldErrors };
  }

  const [supabase, transferToken] = await Promise.all([
    createClient(),
    getLearningTransferCookie(),
  ]);
  const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();

  if (
    currentUserError ||
    !currentUserData.user ||
    currentUserData.user.is_anonymous ||
    !transferToken
  ) {
    return { error: t('validation.verifyEmailFirst') };
  }

  const preparation = await prepareLearningAccountTransfer(transferToken, currentUserData.user.id);

  if (preparation.status !== 'prepared') {
    await clearLearningTransferCookie();
    return { error: t('validation.verifyEmailFirst') };
  }

  await setLearningTransferCookie(transferToken, preparation.expiresAt);

  const { data, error } = await supabase.auth.updateUser({ password: result.data.password });

  if (error || !data.user || data.user.is_anonymous) {
    return { error: t('validation.passwordUpdateFailed') };
  }

  const transfer = await completeSameUserAccountTransfer(transferToken, data.user.id);

  if (transfer.status !== 'consumed' && transfer.status !== 'already-consumed') {
    return { error: t('validation.passwordUpdateFailed') };
  }

  await clearLearningTransferCookie();
  await establishPermanentAccount(data.user);
  redirect(`${ROUTES.LEARN_HOME}?saved=1`);
}

export async function beginExistingAccountTransfer() {
  const identity = await getCurrentIdentity();

  if (identity.kind !== IDENTITY_KIND.GUEST) {
    redirect(ROUTES.LEARN_HOME);
  }

  const transfer = await createLearningAccountTransfer(identity);
  await setLearningTransferCookie(transfer.token, transfer.expiresAt);
  redirect(getAuthRoute(AUTH_MODE.SIGN_IN, ROUTES.LEARN_HOME));
}

export async function retryExistingAccountTransfer(): Promise<SaveAccountState> {
  const [identity, token, t] = await Promise.all([
    getCurrentIdentity(),
    getLearningTransferCookie(),
    getTranslations('learning.saveAccount'),
  ]);

  if ((identity.kind !== IDENTITY_KIND.MEMBER && identity.kind !== IDENTITY_KIND.ADMIN) || !token) {
    return { error: t('mergeUnavailable') };
  }

  try {
    const result = await consumeLearningAccountTransfer(token, identity);

    if (result.status === 'consumed' || result.status === 'already-consumed') {
      await clearLearningTransferCookie();
    } else {
      await clearLearningTransferCookie();
      return { error: t('mergeUnavailable') };
    }
  } catch {
    console.error('Learning account transfer retry failed', {
      destinationUserId: identity.userId,
      transferTokenHash: hashLearningTransferToken(token),
    });
    return { error: t('mergeFailedDescription') };
  }

  redirect(`${ROUTES.LEARN_HOME}?saved=1`);
}
