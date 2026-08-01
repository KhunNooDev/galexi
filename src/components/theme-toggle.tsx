'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import { Tooltip } from './tooltip';

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip label={label}>
      <button
        type='button'
        className='inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
        aria-label={label}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        <Sun aria-hidden='true' className='size-5 dark:hidden' />
        <Moon aria-hidden='true' className='hidden size-5 dark:block' />
      </button>
    </Tooltip>
  );
}
