import Link from 'next/link';
import { ArrowLeft, Orbit } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import type { AppIdentity } from '@/constants/identity';
import { cn } from '@/lib/utils';

type OnboardingShellProps = {
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  identity: AppIdentity;
  step: 0 | 1 | 2 | 3;
  stepLabel: string;
};

export function OnboardingShell({
  backHref,
  backLabel,
  children,
  identity,
  step,
  stepLabel,
}: OnboardingShellProps) {
  return (
    <main className='relative min-h-svh overflow-x-clip bg-background'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-36 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/14 blur-3xl' />
        <div className='absolute right-0 bottom-0 size-72 rounded-full bg-cyan-400/8 blur-3xl' />
      </div>
      <div className='relative mx-auto flex min-h-svh max-w-7xl flex-col'>
        <PageHeader brand identity={identity} />
        <section className='flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12'>
          <div className='w-full max-w-2xl'>
            <div className='mb-5 flex min-h-9 items-center justify-between gap-4'>
              {backHref && backLabel ? (
                <Link
                  href={backHref}
                  className='inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-foreground'
                >
                  <ArrowLeft aria-hidden='true' className='size-4' />
                  {backLabel}
                </Link>
              ) : (
                <span aria-hidden='true' />
              )}
              <span className='text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase'>
                {stepLabel}
              </span>
            </div>
            <div className='mb-5 grid grid-cols-3 gap-2' aria-hidden='true'>
              {[1, 2, 3].map((position) => (
                <span
                  key={position}
                  className={cn(
                    'h-1.5 rounded-full transition-colors',
                    position <= step ? 'bg-primary' : 'bg-secondary-hover',
                  )}
                />
              ))}
            </div>
            <div className='galexi-panel relative overflow-hidden p-5 sm:p-8'>
              <span className='pointer-events-none absolute -top-8 -right-8 grid size-28 place-items-center rounded-full bg-primary/8 text-primary/20'>
                <Orbit aria-hidden='true' className='size-12' />
              </span>
              <div className='relative'>{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
