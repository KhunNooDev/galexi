import type { ComponentProps, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export function SkeletonPulse({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'animate-[pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonBlock({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl bg-secondary-hover/90 dark:bg-secondary-hover/75', className)}
      {...props}
    />
  );
}
