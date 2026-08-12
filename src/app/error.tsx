'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, RotateCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  const t = useTranslations();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <main className='grid flex-1 place-items-center bg-background px-5 py-16 sm:px-8'>
      <section
        aria-describedby='error-description'
        aria-labelledby='error-title'
        className='galexi-panel w-full max-w-lg p-7 text-center sm:p-10'
        role='alert'
      >
        <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger'>
          <TriangleAlert aria-hidden='true' className='size-6' />
        </span>
        <h1 id='error-title' className='mt-5 text-2xl font-semibold text-surface-foreground'>
          {t('boundaries.error.title')}
        </h1>
        <p id='error-description' className='mt-2 text-sm leading-6 text-muted-foreground'>
          {t('boundaries.error.description')}
        </p>
        <div className='mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row'>
          <Button asChild variant='outline' className='rounded-full'>
            <Link href={ROUTES.HOME}>
              <Home aria-hidden='true' />
              {t('boundaries.actions.home')}
            </Link>
          </Button>
          <Button type='button' onClick={unstable_retry} className='rounded-full'>
            <RotateCcw aria-hidden='true' />
            {t('boundaries.actions.retry')}
          </Button>
        </div>
      </section>
    </main>
  );
}
