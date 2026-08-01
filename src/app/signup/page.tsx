import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { signUp } from '@/app/auth/actions';
import { AuthForm } from '@/components/auth-form';
import { AuthPageShell } from '@/components/auth-page-shell';
import { getCurrentUserId } from '@/lib/supabase/auth';

export default async function SignupPage() {
  if (await getCurrentUserId()) {
    redirect('/tasks');
  }

  const auth = await getTranslations('auth');
  const home = await getTranslations('home');

  return (
    <AuthPageShell
      backLabel={auth('backHome')}
      themeLabel={home('themeToggle')}
    >
      <AuthForm action={signUp} mode='sign-up' />
    </AuthPageShell>
  );
}
