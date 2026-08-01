import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  Languages,
  ListTodo,
  Orbit,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';

export default async function Home() {
  const t = await getTranslations('home');
  const features = [
    {
      icon: ShieldCheck,
      title: t('secureTitle'),
      description: t('secureDescription'),
    },
    {
      icon: ListTodo,
      title: t('tasksTitle'),
      description: t('tasksDescription'),
    },
    {
      icon: Languages,
      title: t('languageTitle'),
      description: t('languageDescription'),
    },
  ];

  return (
    <main className='relative min-h-svh overflow-hidden bg-background px-5 py-6 sm:px-8'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute top-1/3 -right-32 size-80 rounded-full bg-[#22d3ee]/10 blur-3xl' />
      </div>

      <div className='relative mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col'>
        <header className='flex items-center justify-between'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground'
          >
            <span className='inline-flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20'>
              <Orbit aria-hidden='true' className='size-5' />
            </span>
            {t('brand')}
          </Link>
          <div className='flex items-center gap-2'>
            <Link
              href='/profile'
              className='inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
              aria-label={t('profile')}
              title={t('profile')}
            >
              <UserRound aria-hidden='true' className='size-4' />
            </Link>
            <ThemeToggle label={t('themeToggle')} />
          </div>
        </header>

        <section className='flex flex-1 flex-col justify-center py-16 sm:py-24'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='mb-5 text-sm font-semibold tracking-[0.2em] text-primary uppercase'>
              {t('eyebrow')}
            </p>
            <h1 className='text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-6xl sm:leading-tight'>
              {t('heading')}
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8'>
              {t('description')}
            </p>
            <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
              <Link
                href='/login'
                className='inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover'
              >
                {t('getStarted')}
                <ArrowRight aria-hidden='true' className='size-4' />
              </Link>
              <Link
                href='/tasks'
                className='inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
              >
                <ListTodo aria-hidden='true' className='size-4' />
                {t('openTasks')}
              </Link>
            </div>
          </div>

          <div className='mx-auto mt-16 grid w-full max-w-4xl gap-4 md:grid-cols-3'>
            {features.map(({ description, icon: Icon, title }) => (
              <article
                key={title}
                className='rounded-3xl border border-border bg-surface/80 p-6 shadow-sm backdrop-blur-sm'
              >
                <span className='mb-4 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <Icon aria-hidden='true' className='size-5' />
                </span>
                <h2 className='font-semibold text-surface-foreground'>
                  {title}
                </h2>
                <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
