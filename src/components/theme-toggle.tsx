'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, label }: { className?: string; label: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type='button'
      variant='outline'
      size='icon-lg'
      className={cn(
        'size-10 cursor-pointer rounded-full border-border bg-surface text-muted-foreground shadow-sm hover:bg-secondary-hover hover:text-foreground dark:bg-surface dark:hover:bg-secondary-hover',
        className,
      )}
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun aria-hidden='true' className='size-5 dark:hidden' />
      <Moon aria-hidden='true' className='hidden size-5 dark:block' />
    </Button>
  );
}
