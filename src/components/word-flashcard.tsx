'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, ImageIcon, RotateCcw } from 'lucide-react';

import { getWordImageRoute } from '@/constants/routes';

export type FlashcardWord = {
  id: number;
  word: string;
  pronunciationIpa: string;
  pronunciationThai: string;
  partOfSpeech: string;
  meaningsTh: string[];
  exampleSentence: string;
  exampleSentenceMeaningTh: string;
  imageUrl: string;
};

export function WordFlashcard({ word }: { word: FlashcardWord }) {
  const t = useTranslations();
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <article className='mx-auto w-full max-w-3xl overflow-hidden rounded-4xl border border-border bg-surface shadow-[0_24px_80px_rgb(51_92_255/14%)]'>
      {word.imageUrl && (
        <div className='relative h-48 overflow-hidden border-b border-border bg-secondary-hover sm:h-64'>
          {/* A user-provided remote URL cannot be safely allow-listed for next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getWordImageRoute(word.id)}
            alt={t('words.flashcard.imageAlt', { word: word.word })}
            className='size-full object-cover'
          />
          <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-surface/70 to-transparent' />
        </div>
      )}

      <div className='p-6 sm:p-10'>
        <div className='text-center'>
          {word.partOfSpeech && (
            <span className='inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-medium tracking-wide text-primary uppercase'>
              {word.partOfSpeech}
            </span>
          )}
          <h1 className='mt-4 text-4xl font-semibold tracking-tight wrap-break-word text-surface-foreground sm:text-6xl'>
            {word.word}
          </h1>
          {(word.pronunciationIpa || word.pronunciationThai) && (
            <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:text-base'>
              {word.pronunciationIpa && <span>{word.pronunciationIpa}</span>}
              {word.pronunciationThai && <span>{word.pronunciationThai}</span>}
            </div>
          )}
        </div>

        <div className='my-8 h-px bg-border' />

        {isRevealed ? (
          <div className='space-y-8' aria-live='polite'>
            <section aria-labelledby='thai-meanings-title'>
              <h2
                id='thai-meanings-title'
                className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'
              >
                {t('words.flashcard.meaningsTitle')}
              </h2>
              <div className='mt-3 flex flex-wrap gap-2'>
                {word.meaningsTh.length > 0 ? (
                  word.meaningsTh.map((meaning) => (
                    <span
                      key={meaning}
                      className='rounded-full bg-primary/12 px-4 py-2 font-medium text-primary'
                    >
                      {meaning}
                    </span>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    {t('words.flashcard.notAvailable')}
                  </p>
                )}
              </div>
            </section>

            {(word.exampleSentence || word.exampleSentenceMeaningTh) && (
              <section aria-labelledby='example-title'>
                <h2
                  id='example-title'
                  className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'
                >
                  {t('words.flashcard.exampleTitle')}
                </h2>
                <blockquote className='mt-3 rounded-2xl border border-border bg-background/60 p-5'>
                  {word.exampleSentence && (
                    <p className='text-base leading-7 text-surface-foreground'>
                      {word.exampleSentence}
                    </p>
                  )}
                  {word.exampleSentenceMeaningTh && (
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                      {word.exampleSentenceMeaningTh}
                    </p>
                  )}
                </blockquote>
              </section>
            )}

            <button
              type='button'
              className='inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
              onClick={() => setIsRevealed(false)}
            >
              <RotateCcw aria-hidden='true' className='size-4' />
              {t('words.flashcard.hideAnswer')}
            </button>
          </div>
        ) : (
          <div className='flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/40 p-8 text-center'>
            <span className='inline-flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary'>
              {word.imageUrl ? (
                <ImageIcon aria-hidden='true' className='size-5' />
              ) : (
                <EyeOff aria-hidden='true' className='size-5' />
              )}
            </span>
            <p className='mt-4 max-w-md text-sm leading-6 text-muted-foreground'>
              {t('words.flashcard.revealHint')}
            </p>
            <button
              type='button'
              className='mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary-hover'
              onClick={() => setIsRevealed(true)}
            >
              <Eye aria-hidden='true' className='size-4' />
              {t('words.flashcard.revealAnswer')}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
