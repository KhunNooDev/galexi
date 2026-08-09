import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, Home, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <main className='grid flex-1 place-items-center bg-background px-5 py-16 sm:px-8'>
      <section
        aria-describedby='not-found-description'
        aria-labelledby='not-found-title'
        className='w-full max-w-lg rounded-3xl border border-border bg-surface p-7 text-center shadow-xl shadow-primary/5 sm:p-10'
      >
        <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary'>
          <SearchX aria-hidden='true' className='size-6' />
        </span>
        <p className='mt-5 text-sm font-semibold tracking-widest text-primary'>404</p>
        <h1 id='not-found-title' className='mt-2 text-2xl font-semibold text-surface-foreground'>
          {t('boundaries.notFound.title')}
        </h1>
        <p id='not-found-description' className='mt-2 text-sm leading-6 text-muted-foreground'>
          {t('boundaries.notFound.description')}
        </p>
        <div className='mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row'>
          <Button asChild variant='outline' className='rounded-full'>
            <Link href={ROUTES.HOME}>
              <Home aria-hidden='true' />
              {t('boundaries.actions.home')}
            </Link>
          </Button>
          <Button asChild className='rounded-full'>
            <Link href={ROUTES.PUBLIC_WORDS}>
              <BookOpen aria-hidden='true' />
              {t('boundaries.actions.browseWords')}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
