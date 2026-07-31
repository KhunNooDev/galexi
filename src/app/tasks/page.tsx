import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { TaskManager } from '@/components/task-manager';
import { ThemeToggle } from '@/components/theme-toggle';
import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function TasksPage() {
  const dictionary = await getDictionary(defaultLocale);
  const { tasks } = dictionary;

  return (
    <main className='min-h-full bg-background px-6 py-12 sm:px-10'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-10 flex items-center justify-between'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            {tasks.backHome}
          </Link>
          <ThemeToggle label={dictionary.home.themeToggle} />
        </div>

        <div className='mb-10 max-w-2xl space-y-3'>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground'>
            {tasks.pageTitle}
          </h1>
          <p className='text-lg leading-8 text-muted-foreground'>
            {tasks.pageDescription}
          </p>
          <p className='text-sm text-muted-foreground'>{tasks.ephemeralNote}</p>
        </div>

        <TaskManager labels={tasks.manager} />
      </div>
    </main>
  );
}
