import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, BookOpenCheck, Orbit, ShieldCheck, Sparkles } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { ROUTES } from '@/constants/routes';

type AuthPageShellProps = {
  children: React.ReactNode;
};

export async function AuthPageShell({ children }: AuthPageShellProps) {
  const t = await getTranslations();
  const benefits = [
    { icon: BookOpenCheck, label: t('auth.benefits.continue') },
    { icon: Sparkles, label: t('auth.benefits.sync') },
    { icon: ShieldCheck, label: t('auth.benefits.private') },
  ];

  return (
    <main className='min-h-svh bg-background'>
      <header className='border-b border-border bg-surface/92 backdrop-blur-xl'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-8'>
          <Link
            href={ROUTES.HOME}
            className='inline-flex min-w-0 items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground'
          >
            <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20'>
              <Orbit aria-hidden='true' className='size-5' />
            </span>
            <span className='truncate'>{t('home.brand')}</span>
          </Link>

          <div className='flex items-center gap-1.5 sm:gap-2'>
            <Link
              href={ROUTES.HOME}
              aria-label={t('auth.backHome')}
              className='inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
            >
              <ArrowLeft aria-hidden='true' className='size-4' />
              <span className='hidden sm:inline'>{t('auth.backHome')}</span>
            </Link>
            <ThemeToggle label={t('home.themeToggle')} />
          </div>
        </div>
      </header>

      <div className='mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,31rem)] lg:gap-16 lg:py-10'>
        <section className='mx-auto max-w-2xl text-center lg:mx-0 lg:text-left'>
          <p className='text-xs font-semibold tracking-[0.24em] text-primary uppercase sm:text-sm'>
            {t('auth.heroEyebrow')}
          </p>
          <h1 className='mt-4 text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl'>
            {t('auth.heroTitle')}
          </h1>
          <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0'>
            {t('auth.heroDescription')}
          </p>

          <div className='mt-8 hidden grid-cols-3 gap-3 sm:grid lg:grid-cols-1 lg:gap-3'>
            {benefits.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className='flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-4 text-left shadow-[0_12px_36px_rgb(34_74_150/6%)]'
              >
                <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                  <Icon aria-hidden='true' className='size-5' />
                </span>
                <span className='text-sm font-medium text-surface-foreground'>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className='flex w-full justify-center lg:justify-end'>{children}</div>
      </div>
    </main>
  );
}
