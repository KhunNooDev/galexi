import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { USER_ROLE } from '@/constants/role';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getUserRole } from '@/server/roles';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  const t = await getTranslations();
  const role = await getUserRole(user.id);
  const formatter = await getFormatter();
  const notAvailable = t('profile.notAvailable');
  const formatDate = (value: string | undefined) =>
    value
      ? formatter.dateTime(new Date(value), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : notAvailable;
  const email = user.email ?? notAvailable;
  const provider =
    typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : notAvailable;
  const details = [
    {
      icon: Mail,
      label: t('profile.email'),
      value: email,
    },
    {
      icon: KeyRound,
      label: t('profile.userId'),
      value: user.id,
    },
    {
      icon: ShieldCheck,
      label: t('profile.verification'),
      value: user.email_confirmed_at ? t('profile.verified') : t('profile.pending'),
    },
    {
      icon: CheckCircle2,
      label: t('profile.provider'),
      value: provider,
    },
    {
      icon: CalendarDays,
      label: t('profile.createdAt'),
      value: formatDate(user.created_at),
    },
    {
      icon: Clock3,
      label: t('profile.lastSignIn'),
      value: formatDate(user.last_sign_in_at),
    },
  ];

  return (
    <main className='min-h-svh bg-background px-4 pb-6 sm:px-8 sm:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <PageHeader
          backHref={ROUTES.HOME}
          backLabel={t('profile.backHome')}
          className='mb-8'
          user={{ email: user.email }}
          actions={
            <Link
              href={role === USER_ROLE.ADMIN ? ROUTES.WORDS : ROUTES.SEARCH_WORDS}
              className='inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary-hover'
            >
              <BookOpenText aria-hidden='true' className='size-4' />
              <span className='hidden sm:inline'>
                {role === USER_ROLE.ADMIN ? t('profile.manageWords') : t('profile.searchWords')}
              </span>
            </Link>
          }
        />

        <section className='mx-auto max-w-4xl overflow-hidden rounded-4xl border border-border bg-surface shadow-[0_24px_80px_rgb(51_92_255/10%)]'>
          <div className='border-b border-border bg-[linear-gradient(135deg,rgb(56_189_248/16%),rgb(79_124_255/14%),rgb(113_88_232/14%))] px-6 py-8 sm:px-10 sm:py-10'>
            <div className='mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground shadow-lg shadow-primary/20'>
              {email === notAvailable ? (
                <UserRound aria-hidden='true' className='size-7' />
              ) : (
                email.charAt(0).toUpperCase()
              )}
            </div>
            <h1 className='text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
              {t('profile.pageTitle')}
            </h1>
            <p className='mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base'>
              {t('profile.pageDescription')}
            </p>
          </div>

          <div className='p-6 sm:p-10'>
            <h2 className='mb-5 text-sm font-semibold tracking-wide text-surface-foreground uppercase'>
              {t('profile.accountDetails')}
            </h2>
            <dl className='grid gap-3 sm:grid-cols-2'>
              {details.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className='flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-background/60 p-4'
                >
                  <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <Icon aria-hidden='true' className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <dt className='text-xs font-medium text-muted-foreground'>{label}</dt>
                    <dd className='mt-1 truncate text-sm font-medium text-surface-foreground'>
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
