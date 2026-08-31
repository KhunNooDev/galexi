import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, Clock3, KeyRound, LogOut, Mail, PencilLine, UserRound } from 'lucide-react';

import { signOut } from '@/app/auth/actions';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { ProfileForm } from '@/components/profile-form';
import { IDENTITY_KIND } from '@/constants/identity';
import { AUTH_ROUTES } from '@/constants/routes';
import { getCurrentIdentity, getCurrentUser } from '@/lib/supabase/auth';
import { getOrCreateProfile } from '@/server/profiles';

export default async function ProfilePage() {
  const identity = await getCurrentIdentity();

  if (identity.kind !== IDENTITY_KIND.MEMBER && identity.kind !== IDENTITY_KIND.ADMIN) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  const user = await getCurrentUser();

  if (!user || user.is_anonymous) {
    redirect(AUTH_ROUTES.SIGN_IN);
  }

  const [t, profile] = await Promise.all([getTranslations(), getOrCreateProfile(identity)]);
  const notAvailable = t('profile.notAvailable');
  const email = user.email ?? notAvailable;
  const displayName = profile.displayName.trim();
  const profileName = displayName || email;
  const isVerified = Boolean(user.email_confirmed_at);
  const provider =
    typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : notAvailable;
  const details = [
    { icon: Mail, label: t('profile.email'), value: email },
    { icon: KeyRound, label: t('profile.provider'), value: provider },
  ];

  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background pb-28 lg:pb-10'>
      <div className='mx-auto max-w-7xl'>
        <section className='mx-auto max-w-xl px-5 pt-8 sm:px-6 sm:pt-12'>
          <div className='flex flex-col items-center text-center'>
            <div className='inline-flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary text-2xl font-semibold text-primary-foreground shadow-lg shadow-primary/18'>
              {profile.avatarUrl ? (
                <ImageWithSkeleton
                  src={profile.avatarUrl}
                  alt={t('profile.avatarAlt', { name: profileName })}
                  className='object-cover'
                  referrerPolicy='no-referrer'
                />
              ) : email === notAvailable ? (
                <UserRound aria-hidden='true' className='size-8' />
              ) : (
                profileName.charAt(0).toUpperCase()
              )}
            </div>
            <div className='mt-4 max-w-full min-w-0'>
              <div className='flex max-w-full items-center justify-center gap-2'>
                <h1 className='truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                  {profileName}
                </h1>
                <span
                  aria-label={isVerified ? t('profile.verified') : t('profile.pending')}
                  className={
                    isVerified
                      ? 'inline-flex shrink-0 items-center text-primary'
                      : 'inline-flex shrink-0 items-center text-muted-foreground'
                  }
                >
                  {isVerified ? (
                    <CheckCircle2 aria-hidden='true' className='size-5' />
                  ) : (
                    <Clock3 aria-hidden='true' className='size-5' />
                  )}
                </span>
              </div>
              <p className='mt-1 truncate text-sm text-muted-foreground sm:text-base'>{email}</p>
            </div>
          </div>

          <details className='group mt-7'>
            <summary className='flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/18 transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-focus/30 focus-visible:outline-none [&::-webkit-details-marker]:hidden'>
              <PencilLine aria-hidden='true' className='size-4' />
              {t('profile.editAction')}
            </summary>
            <div className='mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6'>
              <ProfileForm
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                labels={{
                  displayName: t('profile.displayName'),
                  displayNamePlaceholder: t('profile.displayNamePlaceholder'),
                  displayNameHint: t('profile.displayNameHint'),
                  avatarUrl: t('profile.avatarUrl'),
                  avatarUrlPlaceholder: t('profile.avatarUrlPlaceholder'),
                  avatarUrlHint: t('profile.avatarUrlHint'),
                  save: t('profile.save'),
                  saving: t('profile.saving'),
                }}
              />
            </div>
          </details>

          <div className='mt-9'>
            <h2 className='text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
              {t('profile.accountDetails')}
            </h2>
            <dl className='mt-3 divide-y divide-border border-y border-border'>
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className='flex min-h-18 min-w-0 items-center gap-3 py-4'>
                  <span className='inline-flex size-9 shrink-0 items-center justify-center text-primary'>
                    <Icon aria-hidden='true' className='size-5' strokeWidth={1.8} />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <dt className='text-sm font-medium text-foreground'>{label}</dt>
                    <dd className='mt-0.5 truncate text-sm text-muted-foreground'>{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <form action={signOut} className='mt-7 flex justify-center'>
            <button
              type='submit'
              className='inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/8 focus-visible:ring-3 focus-visible:ring-danger/20 focus-visible:outline-none'
            >
              <LogOut aria-hidden='true' className='size-4' />
              {t('auth.signOut')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
