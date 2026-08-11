import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Tooltip } from '@/components/tooltip';
import { ROUTES } from '@/constants/routes';

type AuthPageShellProps = {
  backLabel: string;
  children: React.ReactNode;
  themeLabel: string;
};

export function AuthPageShell({ backLabel, children, themeLabel }: AuthPageShellProps) {
  return (
    <main className='relative min-h-svh overflow-x-hidden overflow-y-auto bg-auth-backdrop'>
      <Image
        src='/auth-galaxy-background.jpg'
        alt=''
        fill
        preload
        sizes='100vw'
        className='object-cover object-[52%_30%] dark:brightness-45 dark:saturate-125'
      />
      <div className='absolute inset-0 bg-auth-overlay backdrop-saturate-110' />

      <div className='absolute top-5 left-5 z-20 sm:top-7 sm:left-7'>
        <Tooltip label={backLabel} side='bottom'>
          <Link
            href={ROUTES.HOME}
            className='inline-flex size-11 items-center justify-center rounded-full border border-white/60 bg-auth-control text-auth-control-foreground shadow-sm backdrop-blur-md transition-transform hover:-translate-x-0.5'
            aria-label={backLabel}
          >
            <ArrowLeft aria-hidden='true' className='size-5' />
          </Link>
        </Tooltip>
      </div>

      <div className='absolute top-5 right-5 z-20 sm:top-7 sm:right-7'>
        <ThemeToggle label={themeLabel} />
      </div>

      <div className='relative z-10 flex min-h-svh items-end justify-center pt-24 sm:pt-40 md:items-center md:justify-end md:px-[6vw] md:py-12 lg:px-[8vw]'>
        {children}
      </div>
    </main>
  );
}
