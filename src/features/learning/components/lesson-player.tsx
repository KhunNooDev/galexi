'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  ImageIcon,
  RotateCcw,
  Volume2,
} from 'lucide-react';

import { advanceLessonAction } from '@/app/learn/lesson/[lessonKey]/actions';
import { ImageWithSkeleton } from '@/components/image-with-skeleton';
import { Button } from '@/components/ui/button';
import { getWordImageRoute } from '@/constants/routes';
import { ConversationPlayer } from '@/features/learning/components/conversation-player';
import { PracticePlayer } from '@/features/learning/components/practice-player';
import { LESSON_PHASE, type LessonSessionState } from '@/features/learning/lesson.schema';
import type {
  ConversationTurn,
  PracticeQuestionView,
} from '@/features/learning/lessons/lesson-activities';
import type { LessonWord } from '@/features/learning/server/lesson.service';

type LessonPlayerProps = {
  conversation: readonly ConversationTurn[];
  initialState: LessonSessionState;
  lessonKey: string;
  practiceQuestions: PracticeQuestionView[];
  sessionId: string;
  words: LessonWord[];
};

export function LessonPlayer({
  conversation,
  initialState,
  lessonKey,
  practiceQuestions,
  sessionId,
  words,
}: LessonPlayerProps) {
  const t = useTranslations('learning.lesson');
  const [phase, setPhase] = useState(initialState.phase);
  const [wordIndex, setWordIndex] = useState(initialState.wordIndex);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const word = words[wordIndex];

  if (phase === LESSON_PHASE.PRACTICE) {
    return (
      <PracticePlayer
        initialAnsweredCount={initialState.practice.answers.length}
        lessonKey={lessonKey}
        onPhaseChange={setPhase}
        questions={practiceQuestions}
        sessionId={sessionId}
      />
    );
  }

  if (phase === LESSON_PHASE.CONVERSATION) {
    return (
      <ConversationPlayer
        initialResponses={initialState.conversation.responses}
        lessonKey={lessonKey}
        onPhaseChange={setPhase}
        sessionId={sessionId}
        turns={conversation}
      />
    );
  }

  if (phase === LESSON_PHASE.RESULT) {
    return (
      <section className='galexi-panel mx-auto w-full max-w-2xl p-6 text-center sm:p-10'>
        <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary'>
          <CheckCircle2 aria-hidden='true' className='size-7' />
        </span>
        <p className='mt-5 text-xs font-semibold tracking-[0.16em] text-primary uppercase'>
          {t('result.eyebrow')}
        </p>
        <h2 className='mt-2 text-3xl font-semibold tracking-tight text-surface-foreground'>
          {t('result.title')}
        </h2>
        <p className='mx-auto mt-3 max-w-lg leading-7 text-muted-foreground'>
          {t('result.description')}
        </p>
      </section>
    );
  }

  if (!word) {
    return null;
  }

  const progress = ((wordIndex + 1) / words.length) * 100;

  function speakWord() {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en';
    window.speechSynthesis.speak(utterance);
  }

  function goToPreviousWord() {
    setError('');
    setIsRevealed(false);
    setWordIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function goToNextWord() {
    setError('');
    startTransition(async () => {
      const result = await advanceLessonAction({
        expectedWordId: word.id,
        expectedWordIndex: wordIndex,
        lessonKey,
        sessionId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsRevealed(false);
      setPhase(result.phase);
      setWordIndex(result.wordIndex);
    });
  }

  return (
    <div className='mx-auto w-full max-w-xl'>
      <div className='mb-4 flex items-center justify-between gap-4'>
        <p className='text-sm font-medium text-surface-foreground'>
          {t('progress', { current: wordIndex + 1, total: words.length })}
        </p>
        <p className='text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase'>
          {t('learnPhase')}
        </p>
      </div>
      <div
        className='mb-5 h-2 overflow-hidden rounded-full bg-secondary-hover'
        role='progressbar'
        aria-label={t('progressLabel')}
        aria-valuemax={words.length}
        aria-valuemin={1}
        aria-valuenow={wordIndex + 1}
      >
        <div
          className='h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none'
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className='flex min-h-124 flex-col overflow-hidden rounded-4xl border border-border bg-surface shadow-[0_24px_80px_rgb(34_74_150/12%)] sm:min-h-140'>
        <div className='flex flex-1 flex-col p-5 sm:p-7'>
          <div className='text-center'>
            <div className='flex items-center justify-center gap-2'>
              <h1 className='text-4xl font-semibold tracking-tight wrap-break-word text-surface-foreground sm:text-5xl'>
                {word.word}
              </h1>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='rounded-full text-primary hover:bg-primary/10 hover:text-primary'
                aria-label={t('listen', { word: word.word })}
                onClick={speakWord}
              >
                <Volume2 aria-hidden='true' className='size-5' />
              </Button>
            </div>
            {word.partOfSpeech && (
              <span className='mt-2 inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase'>
                {word.partOfSpeech}
              </span>
            )}
            {(word.pronunciationIpa || word.pronunciationThai) && (
              <div className='mt-3 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground'>
                {word.pronunciationIpa && (
                  <span className='rounded-full bg-secondary-hover px-3 py-1.5'>
                    <strong className='mr-1.5 text-xs text-primary'>{t('ipaLabel')}</strong>
                    {word.pronunciationIpa}
                  </span>
                )}
                {word.pronunciationThai && (
                  <span className='rounded-full bg-secondary-hover px-3 py-1.5'>
                    <strong className='mr-1.5 text-xs text-primary'>{t('thaiLabel')}</strong>
                    <span lang='th'>{word.pronunciationThai}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className='my-5 h-px bg-border' />

          {isRevealed ? (
            <div className='flex flex-1 animate-in flex-col gap-4 duration-200 fade-in-0 slide-in-from-bottom-2'>
              <div className={word.imageUrl ? 'grid gap-4 sm:grid-cols-[8rem_1fr]' : ''}>
                {word.imageUrl && (
                  <div className='relative aspect-square w-28 justify-self-center overflow-hidden rounded-2xl border border-border bg-secondary-hover sm:w-32 sm:justify-self-start'>
                    <ImageWithSkeleton
                      src={getWordImageRoute(word.id)}
                      alt={t('imageAlt', { word: word.word })}
                      className='object-cover'
                    />
                  </div>
                )}
                <section>
                  <h2 className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'>
                    {t('meaningsTitle')}
                  </h2>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {word.meaningsTh.map((meaning) => (
                      <span
                        key={meaning}
                        lang='th'
                        className='rounded-full bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary'
                      >
                        {meaning}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
              {(word.exampleSentence || word.exampleSentenceMeaningTh) && (
                <section>
                  <h2 className='text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase'>
                    {t('exampleTitle')}
                  </h2>
                  <blockquote className='mt-2 rounded-2xl border border-border bg-background/60 p-4'>
                    {word.exampleSentence && (
                      <p className='leading-6 text-surface-foreground'>{word.exampleSentence}</p>
                    )}
                    {word.exampleSentenceMeaningTh && (
                      <p className='mt-2 text-sm leading-6 text-muted-foreground' lang='th'>
                        {word.exampleSentenceMeaningTh}
                      </p>
                    )}
                  </blockquote>
                </section>
              )}
            </div>
          ) : (
            <div className='flex flex-1 animate-in flex-col items-center justify-center rounded-3xl border border-dashed border-primary/25 bg-primary/3 p-5 text-center duration-200 fade-in-0'>
              <span className='grid size-12 place-items-center rounded-full bg-primary/12 text-primary'>
                <ImageIcon aria-hidden='true' className='size-5' />
              </span>
              <p className='mt-3 max-w-sm text-sm leading-6 text-muted-foreground'>
                {t('revealHint')}
              </p>
              <Button
                type='button'
                className='mt-4 h-11 rounded-full px-6'
                onClick={() => setIsRevealed(true)}
              >
                <Eye aria-hidden='true' />
                {t('revealAnswer')}
              </Button>
            </div>
          )}
        </div>
      </article>

      {error && (
        <p
          className='mt-4 rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger'
          role='alert'
        >
          {error}
        </p>
      )}
      <p className='sr-only' aria-live='polite'>
        {isPending ? t('saving') : ''}
      </p>
      <div className='mt-4 grid grid-cols-2 gap-3'>
        <Button
          type='button'
          variant='outline'
          className='h-12 rounded-full'
          disabled={isPending || wordIndex === 0}
          onClick={goToPreviousWord}
        >
          <ArrowLeft aria-hidden='true' />
          {t('previous')}
        </Button>
        <Button
          type='button'
          className='h-12 rounded-full'
          disabled={isPending}
          onClick={goToNextWord}
        >
          {isPending ? (
            <>
              <RotateCcw aria-hidden='true' className='animate-spin motion-reduce:animate-none' />
              {t('saving')}
            </>
          ) : (
            <>
              {wordIndex === words.length - 1 ? t('startPractice') : t('next')}
              <ArrowRight aria-hidden='true' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
