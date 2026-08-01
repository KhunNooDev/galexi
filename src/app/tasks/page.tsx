import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, UserRound } from 'lucide-react';

import { signOut } from '@/app/auth/actions';
import { TaskManager } from '@/components/task-manager';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentUserClaims } from '@/lib/supabase/auth';

export default async function TasksPage() {
  const claims = await getCurrentUserClaims();

  if (!claims) {
    redirect('/login');
  }

  const auth = await getTranslations('auth');
  const home = await getTranslations('home');
  const tasks = await getTranslations('tasks');

  return (
    <main className='min-h-full bg-background px-6 py-12 sm:px-10'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-10 flex items-center justify-between gap-4'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            {tasks('backHome')}
          </Link>
          <div className='flex items-center gap-3'>
            <span className='hidden max-w-56 truncate text-sm text-muted-foreground sm:block'>
              {typeof claims.email === 'string' ? claims.email : ''}
            </span>
            <Link
              href='/profile'
              className='inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
              aria-label={home('profile')}
              title={home('profile')}
            >
              <UserRound aria-hidden='true' className='size-4' />
            </Link>
            <form action={signOut}>
              <button
                type='submit'
                className='h-10 cursor-pointer rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary-hover'
              >
                {auth('signOut')}
              </button>
            </form>
            <ThemeToggle label={home('themeToggle')} />
          </div>
        </div>

        <div className='mb-10 max-w-2xl space-y-3'>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground'>
            {tasks('pageTitle')}
          </h1>
          <p className='text-lg leading-8 text-muted-foreground'>
            {tasks('pageDescription')}
          </p>
          <p className='text-sm text-muted-foreground'>
            {tasks('ephemeralNote')}
          </p>
        </div>

        <TaskManager />
      </div>
    </main>
  );
}
