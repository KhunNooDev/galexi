import Link from 'next/link';
import { ArrowRight, BookOpenText } from 'lucide-react';

import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Badge } from '@/components/ui/badge';
import { getPublicWordRoute, getWordImageRoute } from '@/constants/routes';
import { cn } from '@/lib/utils';

type CategoryWordCardProps = {
  imageAlt: string;
  ipaLabel: string;
  meaningsLabel: string;
  openLabel: string;
  thaiPronunciationLabel: string;
  word: {
    id: number;
    imageUrl: string;
    meaningsTh: string[];
    partOfSpeech: string;
    pronunciationIpa: string;
    pronunciationThai: string;
    word: string;
  };
};

export function CategoryWordCard({
  imageAlt,
  ipaLabel,
  meaningsLabel,
  openLabel,
  thaiPronunciationLabel,
  word,
}: CategoryWordCardProps) {
  return (
    <Link
      href={getPublicWordRoute(word.word)}
      className='group flex h-full min-h-80 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/25 focus-visible:outline-none motion-reduce:transform-none'
    >
      <article className='flex h-full flex-col'>
        <div className='flex flex-1 flex-col p-5'>
          <div className='flex items-center justify-between gap-3'>
            <span className='inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-colors group-hover:bg-primary/18'>
              <BookOpenText aria-hidden='true' className='size-5' />
            </span>
            {word.partOfSpeech && (
              <Badge
                variant='secondary'
                className='rounded-full bg-primary/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-primary uppercase'
              >
                {word.partOfSpeech}
              </Badge>
            )}
          </div>

          <h2 className='mt-5 text-2xl font-semibold tracking-tight wrap-break-word text-surface-foreground sm:text-3xl'>
            {word.word}
          </h2>

          {(word.pronunciationIpa || word.pronunciationThai) && (
            <div className='mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground'>
              {word.pronunciationIpa && (
                <span className='rounded-full bg-secondary-hover px-2.5 py-1.5'>
                  <span className='mr-1 font-semibold text-primary'>{ipaLabel}</span>
                  {word.pronunciationIpa}
                </span>
              )}
              {word.pronunciationThai && (
                <span className='rounded-full bg-secondary-hover px-2.5 py-1.5'>
                  <span className='mr-1 font-semibold text-primary'>{thaiPronunciationLabel}</span>
                  <span lang='th'>{word.pronunciationThai}</span>
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              'mt-5 grid flex-1 gap-4 border-t border-border pt-4',
              word.imageUrl && 'grid-cols-[6rem_minmax(0,1fr)]',
            )}
          >
            {word.imageUrl && (
              <div className='relative aspect-square w-24 overflow-hidden rounded-2xl border border-border bg-secondary-hover'>
                <ImageWithSkeleton
                  src={getWordImageRoute(word.id)}
                  alt={imageAlt}
                  className='object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none'
                />
              </div>
            )}

            <div className='min-w-0'>
              <p className='text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase'>
                {meaningsLabel}
              </p>
              <div className='mt-2 flex flex-wrap gap-2'>
                {word.meaningsTh.slice(0, 3).map((meaning) => (
                  <span
                    key={meaning}
                    lang='th'
                    className='max-w-full truncate rounded-full bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary'
                  >
                    {meaning}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between border-t border-border bg-background/30 px-5 py-3.5 text-sm font-medium text-primary'>
          <span>{openLabel}</span>
          <ArrowRight
            aria-hidden='true'
            className='size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none'
          />
        </div>
      </article>
    </Link>
  );
}
