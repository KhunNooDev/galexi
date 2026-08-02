'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, RotateCcw, Volume2 } from 'lucide-react';

import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Button } from '@/components/ui/button';
import { getWordImageRoute } from '@/constants/routes';
import { cn } from '@/lib/utils';

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
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const revealButtonRef = useRef<HTMLButtonElement>(null);
  const studyAgainButtonRef = useRef<HTMLButtonElement>(null);
  const shouldMoveFocusRef = useRef(false);
  const meaningsTitleId = useId();
  const exampleTitleId = useId();

  useEffect(() => {
    if (!shouldMoveFocusRef.current) {
      return;
    }

    shouldMoveFocusRef.current = false;

    if (isRevealed) {
      studyAgainButtonRef.current?.focus();
    } else {
      revealButtonRef.current?.focus();
    }
  }, [isRevealed]);

  function setRevealed(revealed: boolean, moveFocus = false) {
    shouldMoveFocusRef.current = moveFocus;

    if (revealed) {
      setHasRevealed(true);
    }

    setIsRevealed(revealed);
  }

  function speakWord() {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en';
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className='mx-auto w-full max-w-lg'>
      <article className='flex aspect-3/4 w-full flex-col overflow-hidden rounded-4xl border border-border bg-surface shadow-[0_24px_80px_rgb(51_92_255/14%)]'>
        <div className='flex min-h-0 flex-1 flex-col p-4 sm:p-6'>
          <div className='shrink-0 text-center'>
            <div className='flex items-center justify-center gap-2'>
              <h1 className='text-4xl font-semibold tracking-tight wrap-break-word text-surface-foreground sm:text-5xl'>
                {word.word}
              </h1>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='shrink-0 cursor-pointer rounded-full text-primary hover:bg-primary/10 hover:text-primary'
                aria-label={t('words.flashcard.listen', { word: word.word })}
                onClick={speakWord}
              >
                <Volume2 aria-hidden='true' className='size-5' />
              </Button>
            </div>
            {word.partOfSpeech && (
              <span className='mt-2 inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-medium tracking-wide text-primary uppercase'>
                {word.partOfSpeech}
              </span>
            )}
            {(word.pronunciationIpa || word.pronunciationThai) && (
              <div className='mt-2 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground sm:mt-3'>
                {word.pronunciationIpa && (
                  <span className='rounded-full bg-secondary-hover px-3 py-1.5'>
                    <span className='mr-1.5 text-xs font-semibold text-primary'>
                      {t('words.flashcard.ipaLabel')}
                    </span>
                    {word.pronunciationIpa}
                  </span>
                )}
                {word.pronunciationThai && (
                  <span className='rounded-full bg-secondary-hover px-3 py-1.5'>
                    <span className='mr-1.5 text-xs font-semibold text-primary'>
                      {t('words.flashcard.thaiPronunciationLabel')}
                    </span>
                    <span lang='th'>{word.pronunciationThai}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className='my-3 h-px shrink-0 bg-border sm:my-4' />

          {hasRevealed && (
            <div
              key='answer'
              data-flashcard-state
              hidden={!isRevealed}
              className='flex min-h-0 flex-1 animate-in scrollbar-none flex-col gap-3 overflow-y-auto overscroll-contain duration-200 fade-in-0 slide-in-from-bottom-2 sm:gap-4'
              aria-live='polite'
            >
              <div
                className={cn(
                  'grid shrink-0 gap-3',
                  word.imageUrl && 'sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start',
                )}
              >
                {word.imageUrl && (
                  <div className='relative aspect-square w-28 justify-self-center overflow-hidden rounded-2xl border border-border bg-secondary-hover sm:w-36 sm:justify-self-start'>
                    <ImageWithSkeleton
                      src={getWordImageRoute(word.id)}
                      alt={t('words.flashcard.imageAlt', { word: word.word })}
                      className='object-cover'
                    />
                    <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-surface/30 to-transparent' />
                  </div>
                )}

                <section className='min-w-0' aria-labelledby={meaningsTitleId}>
                  <h2
                    id={meaningsTitleId}
                    className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'
                  >
                    {t('words.flashcard.meaningsTitle')}
                  </h2>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {word.meaningsTh.length > 0 ? (
                      word.meaningsTh.map((meaning) => (
                        <span
                          key={meaning}
                          className='rounded-full bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary'
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
              </div>

              {(word.exampleSentence || word.exampleSentenceMeaningTh) && (
                <section className='min-h-0 flex-1' aria-labelledby={exampleTitleId}>
                  <h2
                    id={exampleTitleId}
                    className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'
                  >
                    {t('words.flashcard.exampleTitle')}
                  </h2>
                  <blockquote className='mt-2 rounded-2xl border border-border bg-background/60 p-3 sm:p-4'>
                    {word.exampleSentence && (
                      <p className='text-sm leading-5 text-surface-foreground sm:text-base sm:leading-6'>
                        {word.exampleSentence}
                      </p>
                    )}
                    {word.exampleSentenceMeaningTh && (
                      <p className='mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm'>
                        {word.exampleSentenceMeaningTh}
                      </p>
                    )}
                  </blockquote>
                </section>
              )}
            </div>
          )}

          <div
            key='question'
            data-flashcard-state
            hidden={isRevealed}
            className='flex min-h-0 flex-1 animate-in flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/40 p-3 text-center duration-200 fade-in-0 slide-in-from-bottom-2 sm:p-5'
          >
            <span className='inline-flex size-10 items-center justify-center rounded-full bg-primary/12 text-primary sm:size-12'>
              <EyeOff aria-hidden='true' className='size-5' />
            </span>
            <p className='mt-2 max-w-md text-sm leading-5 text-muted-foreground sm:mt-3 sm:leading-6'>
              {t('words.flashcard.revealHint')}
            </p>
            <Button
              ref={revealButtonRef}
              type='button'
              className='mt-3 h-10 cursor-pointer rounded-full bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover sm:mt-4 sm:h-11 sm:px-6'
              onClick={(event) => setRevealed(true, event.detail === 0)}
            >
              <Eye aria-hidden='true' className='size-4' />
              {t('words.flashcard.revealAnswer')}
            </Button>
          </div>
        </div>
      </article>

      {isRevealed && (
        <Button
          ref={studyAgainButtonRef}
          type='button'
          variant='outline'
          className='mt-4 h-11 w-full animate-in cursor-pointer rounded-full border-border bg-surface font-medium text-surface-foreground duration-200 fade-in-0 slide-in-from-top-2 hover:bg-secondary-hover dark:bg-surface dark:hover:bg-secondary-hover'
          onClick={(event) => setRevealed(false, event.detail === 0)}
        >
          <RotateCcw aria-hidden='true' className='size-4' />
          {t('words.flashcard.hideAnswer')}
        </Button>
      )}
    </div>
  );
}
