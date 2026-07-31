import Image from 'next/image';
import Link from 'next/link';

import { HonoHealthButton } from '@/components/hono-health-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function Home() {
  const { home } = await getDictionary(defaultLocale);

  return (
    <div className='relative flex flex-1 flex-col items-center justify-center bg-background font-sans'>
      <div className='absolute top-6 right-6'>
        <ThemeToggle label={home.themeToggle} />
      </div>
      <main className='flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-surface px-16 py-32 sm:items-start'>
        <Image
          className='dark:invert'
          src='/next.svg'
          alt={home.logoAlt}
          width={100}
          height={20}
          priority
        />
        <div className='flex flex-col items-center gap-6 text-center sm:items-start sm:text-left'>
          <h1 className='max-w-xs text-3xl leading-10 font-semibold tracking-tight text-surface-foreground'>
            {home.heading}
          </h1>
          <p className='max-w-md text-lg leading-8 text-muted-foreground'>
            {home.introStart}{' '}
            <a
              href='https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
              className='font-medium text-surface-foreground'
            >
              {home.templates}
            </a>{' '}
            {home.introMiddle}{' '}
            <a
              href='https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
              className='font-medium text-surface-foreground'
            >
              {home.learning}
            </a>{' '}
            {home.introEnd}
          </p>
        </div>
        <div className='flex flex-col gap-4 text-base font-medium sm:flex-row sm:flex-wrap'>
          <a
            className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-colors hover:bg-primary-hover md:w-39.5'
            href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Image
              className='h-auto w-4 dark:invert'
              src='/vercel.svg'
              alt={home.vercelAlt}
              width={1155}
              height={1000}
            />
            {home.deploy}
          </a>
          <a
            className='flex h-12 w-full items-center justify-center rounded-full border border-solid border-border px-5 transition-colors hover:border-transparent hover:bg-secondary-hover md:w-39.5'
            href='https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'
          >
            {home.documentation}
          </a>
          <HonoHealthButton
            labels={{
              idle: home.honoCheck,
              loading: home.honoChecking,
              success: home.honoHealthy,
              error: home.honoError,
            }}
          />
          <Link
            href='/tasks'
            className='flex h-12 w-full items-center justify-center rounded-full border border-border px-5 transition-colors hover:bg-secondary-hover md:w-39.5'
          >
            {home.crudDemo}
          </Link>
        </div>
      </main>
    </div>
  );
}
