import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { signIn, signUp } from '@/app/auth/actions';
import { AuthForm } from '@/components/auth-form';
import { AuthPageShell } from '@/components/auth-page-shell';
import { AUTH_MODE } from '@/constants/auth';
import { IDENTITY_KIND } from '@/constants/identity';
import { getSafeAuthReturnTo, ROUTES } from '@/constants/routes';
import { getLearningTransferCookie } from '@/features/learning/account/server/transfer-cookie';
import { getCurrentIdentity } from '@/lib/supabase/auth';

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    next?: string | string[];
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const [{ mode: requestedMode, next }, identity, transferToken] = await Promise.all([
    searchParams,
    getCurrentIdentity(),
    getLearningTransferCookie(),
  ]);
  const returnTo = getSafeAuthReturnTo(next);
  const mode = requestedMode === AUTH_MODE.SIGN_UP ? AUTH_MODE.SIGN_UP : AUTH_MODE.SIGN_IN;

  if (identity.kind === IDENTITY_KIND.GUEST) {
    if (mode === AUTH_MODE.SIGN_UP) {
      redirect(`${ROUTES.LEARN_SAVE}?step=create`);
    }

    if (!transferToken) {
      redirect(ROUTES.LEARN_SAVE);
    }
  }

  if (identity.kind === IDENTITY_KIND.ADMIN) {
    redirect(returnTo ?? ROUTES.MANAGE_WORDS);
  }

  if (identity.kind === IDENTITY_KIND.MEMBER) {
    redirect(returnTo ?? ROUTES.PUBLIC_WORDS);
  }

  const t = await getTranslations();
  const action =
    mode === AUTH_MODE.SIGN_IN ? signIn.bind(null, returnTo) : signUp.bind(null, returnTo);

  return (
    <AuthPageShell backLabel={t('auth.backHome')} themeLabel={t('home.themeToggle')}>
      <AuthForm key={mode} action={action} mode={mode} returnTo={returnTo} />
    </AuthPageShell>
  );
}
