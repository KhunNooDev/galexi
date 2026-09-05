import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export function FetchingContent({
  children,
  fetching,
  stale,
  label,
}: {
  children: ReactNode;
  fetching: boolean;
  stale: boolean;
  label: string;
}) {
  return (
    <div className='relative'>
      <div
        role='status'
        aria-live='polite'
        aria-atomic='true'
        className='pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center'
      >
        {fetching && (
          <span className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-3 py-2 text-sm font-medium text-primary shadow-lg'>
            <LoaderCircle
              aria-hidden='true'
              className='size-4 animate-spin motion-reduce:animate-none'
            />
            {label}
          </span>
        )}
      </div>
      <div
        aria-busy={fetching}
        inert={stale}
        className={cn(
          'transition-opacity duration-150 motion-reduce:transition-none',
          fetching && 'opacity-45',
        )}
      >
        {children}
      </div>
    </div>
  );
}
