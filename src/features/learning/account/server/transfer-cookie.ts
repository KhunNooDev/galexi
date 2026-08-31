import 'server-only';

import { cookies } from 'next/headers';

import { LEARNING_ACCOUNT_TRANSFER } from '@/features/learning/account/account.constants';

export async function setLearningTransferCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(LEARNING_ACCOUNT_TRANSFER.COOKIE_NAME, token, {
    expires: expiresAt,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getLearningTransferCookie() {
  return (await cookies()).get(LEARNING_ACCOUNT_TRANSFER.COOKIE_NAME)?.value ?? null;
}

export async function clearLearningTransferCookie() {
  (await cookies()).delete(LEARNING_ACCOUNT_TRANSFER.COOKIE_NAME);
}
