import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, UserRound } from 'lucide-react';

import { signOut } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tooltip } from '@/components/tooltip';
import { WordManager } from '@/components/word-manager';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';

export default async function WordsPage() {
  const claims = await getCurrentUserClaims();

  if (!claims) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  if ((await getUserRole(claims.sub)) !== USER_ROLE.ADMIN) {
    redirect(ROUTES.SEARCH_WORDS);
  }

  const t = await getTranslations();

  return (
    <main className='relative min-h-full overflow-x-clip bg-background px-4 py-4 sm:px-8 sm:py-8'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute top-72 -right-40 size-96 rounded-full bg-[#22d3ee]/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-6xl'>
        <header className='mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5'>
          <Link
            href={ROUTES.HOME}
            className='inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            {t('words.backHome')}
          </Link>
          <div className='flex items-center gap-3'>
            <span className='hidden max-w-56 truncate text-sm text-muted-foreground lg:block'>
              {typeof claims.email === 'string' ? claims.email : ''}
            </span>
            <Tooltip label={t('home.profile')} side='bottom'>
              <Link
                href={ROUTES.PROFILE}
                className='inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
                aria-label={t('home.profile')}
              >
                <UserRound aria-hidden='true' className='size-4' />
              </Link>
            </Tooltip>
            <form action={signOut}>
              <button
                type='submit'
                className='h-10 cursor-pointer rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary-hover'
              >
                {t('auth.signOut')}
              </button>
            </form>
            <ThemeToggle label={t('home.themeToggle')} />
          </div>
        </header>

        <WordManager />
      </div>
    </main>
  );
}
