'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Eye, RotateCcw, Volume2 } from 'lucide-react';

import { advanceLessonAction } from '@/app/learn/lesson/[lessonKey]/actions';
import { Button } from '@/components/ui/button';
import { getLessonResultRoute } from '@/constants/routes';
import { ConversationPlayer } from '@/features/learning/components/conversation-player';
import { PracticePlayer } from '@/features/learning/components/practice-player';
import {
  LESSON_PHASE,
  type LessonSessionState,
  type LessonWord,
} from '@/features/learning/lesson.schema';
import type {
  ConversationTurn,
  PracticeQuestionView,
} from '@/features/learning/lessons/lesson-activities';

type LessonPlayerProps = {
  conversation: readonly ConversationTurn[];
  initialState: LessonSessionState;
  lessonKey: string;
  practiceQuestions: PracticeQuestionView[];
  sessionId: string;
  words: LessonWord[];
};

function speakEnglish(text: string) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function LessonPlayer({
  conversation,
  initialState,
  lessonKey,
  practiceQuestions,
  sessionId,
  words,
}: LessonPlayerProps) {
  const t = useTranslations('learning.lesson');
  const router = useRouter();
  const [phase, setPhase] = useState(initialState.phase);
  const [wordIndex, setWordIndex] = useState(initialState.wordIndex);
  const [isRevealed, setIsRevealed] = useState(() =>
    initialState.seenWordSenseIds.includes(words[initialState.wordIndex]?.id),
  );
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const word = words[wordIndex];

  useEffect(() => {
    if (phase !== LESSON_PHASE.LEARN || !word) {
      return;
    }

    speakEnglish(word.word);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [phase, word]);

  function handlePhaseChange(nextPhase: typeof phase) {
    if (nextPhase === LESSON_PHASE.RESULT) {
      router.push(getLessonResultRoute(lessonKey, sessionId));
      return;
    }

    setPhase(nextPhase);
  }

  if (phase === LESSON_PHASE.PRACTICE) {
    return (
      <PracticePlayer
        initialAnsweredCount={initialState.practice.answers.length}
        lessonKey={lessonKey}
        onPhaseChange={handlePhaseChange}
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
        onPhaseChange={handlePhaseChange}
        sessionId={sessionId}
        turns={conversation}
      />
    );
  }

  if (!word) {
    return null;
  }

  const progress = ((wordIndex + 1) / words.length) * 100;

  function goToPreviousWord() {
    const previousIndex = Math.max(0, wordIndex - 1);
    setError('');
    setIsRevealed(initialState.seenWordSenseIds.includes(words[previousIndex]?.id));
    setWordIndex(previousIndex);
  }

  function goToNextWord() {
    setError('');
    startTransition(async () => {
      const result = await advanceLessonAction({
        expectedWordSenseId: word.id,
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

      <article className='flex min-h-112 flex-col overflow-hidden rounded-4xl border border-border bg-surface shadow-[0_20px_64px_rgb(34_74_150/10%)] sm:min-h-124'>
        <div className='flex flex-1 flex-col p-5 sm:p-7'>
          <div>
            <div className='flex items-start justify-between gap-4'>
              <h1 className='min-w-0 text-4xl font-semibold tracking-tight wrap-break-word text-surface-foreground sm:text-5xl'>
                {word.word}
              </h1>
              <Button
                type='button'
                variant='ghost'
                className='size-11 shrink-0 rounded-full bg-primary/10 p-0 text-primary hover:bg-primary/18 hover:text-primary'
                aria-label={t('listen', { word: word.word })}
                onClick={() => speakEnglish(word.word)}
              >
                <Volume2 aria-hidden='true' className='size-5.5' />
              </Button>
            </div>
            {word.partOfSpeech && (
              <span className='mt-3 inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase'>
                {word.partOfSpeech}
              </span>
            )}
            {(word.pronunciationIpa || word.pronunciationThai) && (
              <p className='mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:text-base'>
                {word.pronunciationIpa && <span>{word.pronunciationIpa}</span>}
                {word.pronunciationIpa && word.pronunciationThai && (
                  <span aria-hidden='true' className='text-border'>
                    ·
                  </span>
                )}
                {word.pronunciationThai && <span lang='th'>{word.pronunciationThai}</span>}
              </p>
            )}
          </div>

          <div className='my-6 h-px bg-border' />

          {isRevealed ? (
            <div className='flex flex-1 animate-in flex-col duration-200 fade-in-0 slide-in-from-bottom-2'>
              <section>
                <h2 className='sr-only'>{t('meaningsTitle')}</h2>
                <div className='flex flex-wrap gap-x-3 gap-y-1'>
                  {word.meaningsTh.map((meaning) => (
                    <span
                      key={meaning}
                      lang='th'
                      className='text-xl leading-8 font-semibold text-primary sm:text-2xl'
                    >
                      {meaning}
                    </span>
                  ))}
                </div>
              </section>
              {(word.exampleSentence || word.exampleSentenceMeaningTh) && (
                <section className='mt-6 border-t border-border pt-6'>
                  <h2 className='sr-only'>{t('exampleTitle')}</h2>
                  <blockquote>
                    {word.exampleSentence && (
                      <div className='flex items-start gap-3'>
                        <p className='min-w-0 flex-1 text-base leading-7 text-surface-foreground sm:text-lg'>
                          {word.exampleSentence}
                        </p>
                        <Button
                          type='button'
                          variant='ghost'
                          className='size-11 shrink-0 rounded-full bg-primary/10 p-0 text-primary hover:bg-primary/18 hover:text-primary'
                          aria-label={t('listenExample')}
                          onClick={() => speakEnglish(word.exampleSentence)}
                        >
                          <Volume2 aria-hidden='true' className='size-5' />
                        </Button>
                      </div>
                    )}
                    {word.exampleSentenceMeaningTh && (
                      <p className='mt-3 text-sm leading-6 text-muted-foreground' lang='th'>
                        {word.exampleSentenceMeaningTh}
                      </p>
                    )}
                  </blockquote>
                </section>
              )}
            </div>
          ) : (
            <div className='flex flex-1 animate-in flex-col items-center justify-center px-2 py-6 text-center duration-200 fade-in-0'>
              <p className='max-w-sm text-sm leading-6 text-muted-foreground'>{t('revealHint')}</p>
              <Button
                type='button'
                className='mt-5 h-11 rounded-full px-6'
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
          disabled={isPending || !isRevealed}
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
