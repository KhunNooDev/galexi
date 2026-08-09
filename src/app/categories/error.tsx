'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export default function CategoriesError({ reset }: { reset: () => void }) {
  const t = useTranslations();
  return (
    <main className='grid min-h-svh place-items-center bg-background p-6 text-center'>
      <div>
        <h1 className='text-2xl font-semibold'>{t('categories.errorTitle')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('categories.errorDescription')}</p>
        <Button className='mt-6 rounded-full' onClick={reset}>
          {t('categories.tryAgain')}
        </Button>
      </div>
    </main>
  );
}
