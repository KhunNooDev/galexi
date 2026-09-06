import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

type LegalSection = {
  body: string;
  title: string;
};

type LegalPageProps = {
  backLabel: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  title: string;
};

export function LegalPage({ backLabel, intro, lastUpdated, sections, title }: LegalPageProps) {
  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background px-4 py-10 pb-28 sm:px-8 sm:py-14 lg:pb-14'>
      <article className='mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-[0_24px_80px_rgb(34_74_150/8%)] sm:p-10'>
        <Link
          href={ROUTES.HOME}
          className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
        >
          <ArrowLeft aria-hidden='true' className='size-4' />
          {backLabel}
        </Link>
        <h1 className='mt-6 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
          {title}
        </h1>
        <p className='mt-3 text-sm text-muted-foreground'>{lastUpdated}</p>
        <p className='mt-6 text-base leading-7 text-surface-foreground'>{intro}</p>
        <div className='mt-8 space-y-8'>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className='text-xl font-semibold text-surface-foreground'>{section.title}</h2>
              <p className='mt-2 leading-7 text-muted-foreground'>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
