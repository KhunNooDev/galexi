import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { signIn, signUp } from '@/app/auth/actions';
import { AuthForm } from '@/components/auth-form';
import { AuthPageShell } from '@/components/auth-page-shell';
import { AUTH_MODE } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { getCurrentUserId } from '@/lib/supabase/auth';

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  if (await getCurrentUserId()) {
    redirect(ROUTES.TASKS);
  }

  const { mode: requestedMode } = await searchParams;
  const mode =
    requestedMode === AUTH_MODE.SIGN_UP ? AUTH_MODE.SIGN_UP : AUTH_MODE.SIGN_IN;
  const t = await getTranslations();

  return (
    <AuthPageShell
      backLabel={t('auth.backHome')}
      themeLabel={t('home.themeToggle')}
    >
      <AuthForm
        key={mode}
        action={mode === AUTH_MODE.SIGN_IN ? signIn : signUp}
        mode={mode}
      />
    </AuthPageShell>
  );
}
