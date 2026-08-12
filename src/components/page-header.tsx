import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Orbit } from 'lucide-react';

import { AdminNavigation } from '@/components/admin-navigation';
import { ProfileMenu } from '@/components/profile-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import type { AppIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { getCurrentIdentity } from '@/lib/supabase/auth';

type PageHeaderProps = {
  backHref?: string;
  backLabel?: string;
  brand?: boolean;
  identity?: AppIdentity;
};

export async function PageHeader({
  backHref,
  backLabel,
  brand = false,
  identity,
}: PageHeaderProps) {
  const [resolvedIdentity, t] = await Promise.all([
    identity ?? getCurrentIdentity(),
    getTranslations(),
  ]);

  return (
    <header
      className='sticky top-0 z-40 w-dvw border-b border-border bg-surface/92 shadow-[0_8px_32px_rgb(34_74_150/6%)] backdrop-blur-xl'
      style={{ marginLeft: 'calc(50% - 50dvw)' }}
    >
      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-8'>
        {brand ? (
          <Link
            href={ROUTES.HOME}
            className='inline-flex min-w-0 items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground'
          >
            <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20'>
              <Orbit aria-hidden='true' className='size-5' />
            </span>
            <span className='truncate'>{t('home.brand')}</span>
          </Link>
        ) : (
          <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
            <Link
              href={ROUTES.HOME}
              className='hidden shrink-0 items-center gap-2.5 text-base font-semibold tracking-tight text-foreground sm:inline-flex'
            >
              <span className='inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20'>
                <Orbit aria-hidden='true' className='size-4.5' />
              </span>
              <span className='hidden md:inline'>{t('home.brand')}</span>
            </Link>
            <span aria-hidden='true' className='hidden h-6 w-px bg-border sm:block' />
            <Link
              href={backHref ?? ROUTES.HOME}
              className='inline-flex h-9 min-w-0 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
            >
              <ArrowLeft aria-hidden='true' className='size-4 shrink-0' />
              <span className='truncate'>{backLabel ?? t('auth.backHome')}</span>
            </Link>
          </div>
        )}

        <div className='flex shrink-0 items-center gap-2'>
          {resolvedIdentity.kind === IDENTITY_KIND.ADMIN && (
            <AdminNavigation
              categoriesLabel={t('header.categories')}
              menuLabel={t('header.adminNavigation')}
              wordsLabel={t('header.words')}
            />
          )}
          <div className='flex items-center gap-2'>
            <ThemeToggle label={t('home.themeToggle')} />
            <ProfileMenu
              accountMenuLabel={t('header.accountMenu')}
              email={resolvedIdentity.email ?? undefined}
              guestDescription={t('header.guestDescription')}
              guestLabel={t('header.guest')}
              identityKind={resolvedIdentity.kind}
              profileLabel={t('home.profile')}
              signInLabel={t('auth.signIn')}
              signOutLabel={t('auth.signOut')}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
