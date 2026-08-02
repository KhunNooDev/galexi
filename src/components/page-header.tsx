import { type ReactNode } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Orbit } from 'lucide-react';

import { ProfileMenu } from '@/components/profile-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { ROUTES } from '@/constants/routes';
import { getCurrentUserClaims } from '@/lib/supabase/auth';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  brand?: boolean;
  className?: string;
  user?: {
    email?: string;
  } | null;
};

export async function PageHeader({
  actions,
  backHref,
  backLabel,
  brand = false,
  className,
  user,
}: PageHeaderProps) {
  const [claims, t] = await Promise.all([
    user === undefined ? getCurrentUserClaims() : Promise.resolve(null),
    getTranslations(),
  ]);
  const resolvedUser =
    user === undefined
      ? claims
        ? { email: typeof claims.email === 'string' ? claims.email : undefined }
        : null
      : user;

  return (
    <header
      className={cn(
        'sticky top-0 isolate z-40 flex h-16 w-full items-center justify-between gap-3 px-4 before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-dvw before:-translate-x-1/2 before:border-b before:border-border before:bg-surface/90 before:shadow-sm before:backdrop-blur-xl sm:px-5',
        className,
      )}
    >
      {brand ? (
        <Link
          href={ROUTES.HOME}
          className='inline-flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight text-foreground'
        >
          <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20'>
            <Orbit aria-hidden='true' className='size-5' />
          </span>
          <span className='truncate'>{t('home.brand')}</span>
        </Link>
      ) : (
        <Link
          href={backHref ?? ROUTES.HOME}
          className='inline-flex h-10 min-w-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
        >
          <ArrowLeft aria-hidden='true' className='size-4 shrink-0' />
          <span className='truncate'>{backLabel ?? t('auth.backHome')}</span>
        </Link>
      )}

      <div className='flex shrink-0 items-center gap-2'>
        {actions}
        <ThemeToggle label={t('home.themeToggle')} />
        <ProfileMenu
          accountMenuLabel={t('header.accountMenu')}
          email={resolvedUser?.email}
          isAuthenticated={resolvedUser !== null}
          profileLabel={t('home.profile')}
          signInLabel={t('auth.signIn')}
          signOutLabel={t('auth.signOut')}
          signedInAsLabel={t('header.signedInAs')}
        />
      </div>
    </header>
  );
}
