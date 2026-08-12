'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, RotateCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

type LearningErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function LearningError({ error, unstable_retry }: LearningErrorProps) {
  const t = useTranslations('learning');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <main className='grid min-h-svh place-items-center bg-background px-5 py-12 sm:px-8'>
      <section className='galexi-panel w-full max-w-lg p-7 text-center sm:p-9' role='alert'>
        <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger'>
          <TriangleAlert aria-hidden='true' className='size-6' />
        </span>
        <h1 className='mt-5 text-2xl font-semibold text-surface-foreground'>
          {t('errors.pageTitle')}
        </h1>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          {t('errors.pageDescription')}
        </p>
        <div className='mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row'>
          <Button asChild className='rounded-full' variant='outline'>
            <Link href={ROUTES.HOME}>
              <Home aria-hidden='true' />
              {t('backHome')}
            </Link>
          </Button>
          <Button className='rounded-full' onClick={unstable_retry} type='button'>
            <RotateCcw aria-hidden='true' />
            {t('retry')}
          </Button>
        </div>
      </section>
    </main>
  );
}
