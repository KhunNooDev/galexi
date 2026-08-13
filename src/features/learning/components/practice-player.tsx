'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, CheckCircle2, LoaderCircle, Sparkles, XCircle } from 'lucide-react';

import { submitPracticeAnswerAction } from '@/app/learn/lesson/[lessonKey]/actions';
import { Button } from '@/components/ui/button';
import { LESSON_PHASE, type LessonPhase } from '@/features/learning/lesson.schema';
import type { PracticeQuestionView } from '@/features/learning/lessons/lesson-activities';
import { cn } from '@/lib/utils';

type PracticeFeedback = {
  correctOptionId: string;
  isCorrect: boolean;
  meaning: string;
  word: string;
};

type PracticePlayerProps = {
  initialAnsweredCount: number;
  lessonKey: string;
  onPhaseChange: (phase: LessonPhase) => void;
  questions: PracticeQuestionView[];
  sessionId: string;
};

export function PracticePlayer({
  initialAnsweredCount,
  lessonKey,
  onPhaseChange,
  questions,
  sessionId,
}: PracticePlayerProps) {
  const t = useTranslations('learning.lesson.practice');
  const [questionIndex, setQuestionIndex] = useState(initialAnsweredCount);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [nextPhase, setNextPhase] = useState<LessonPhase>(LESSON_PHASE.PRACTICE);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const question = questions[questionIndex];

  if (!question) {
    return null;
  }

  const progress = ((questionIndex + 1) / questions.length) * 100;

  function submitAnswer() {
    if (!selectedOptionId || feedback) {
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await submitPracticeAnswerAction({
        lessonKey,
        questionId: question.id,
        selectedOptionId,
        sessionId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFeedback(result.feedback);
      setNextPhase(result.phase);
    });
  }

  function continuePractice() {
    if (nextPhase !== LESSON_PHASE.PRACTICE) {
      onPhaseChange(nextPhase);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedOptionId('');
    setFeedback(null);
    setError('');
  }

  return (
    <section className='mx-auto w-full max-w-2xl'>
      <div className='mb-4 flex items-center justify-between gap-4'>
        <p className='text-sm font-medium text-surface-foreground'>
          {t('progress', { current: questionIndex + 1, total: questions.length })}
        </p>
        <span className='inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
          <Sparkles aria-hidden='true' className='size-4' />
          {t('phase')}
        </span>
      </div>
      <div
        className='mb-5 h-2 overflow-hidden rounded-full bg-secondary-hover'
        role='progressbar'
        aria-label={t('progressLabel')}
        aria-valuemax={questions.length}
        aria-valuemin={1}
        aria-valuenow={questionIndex + 1}
      >
        <div
          className='h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none'
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className='galexi-panel overflow-hidden'>
        <div className='border-b border-border bg-primary/5 px-5 py-5 sm:px-7'>
          <p className='text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
            {question.kind === 'meaning-to-word'
              ? t('meaningToWordLabel')
              : t('wordToMeaningLabel')}
          </p>
          <h2
            className='mt-2 text-xl leading-8 font-semibold text-surface-foreground sm:text-2xl'
            lang={question.kind === 'meaning-to-word' ? 'th' : 'en'}
          >
            {question.kind === 'meaning-to-word'
              ? t('meaningToWordPrompt', { meaning: question.promptValue })
              : t('wordToMeaningPrompt', { word: question.promptValue })}
          </h2>
        </div>

        <div className='p-5 sm:p-7'>
          <div className='grid gap-3' role='group' aria-label={t('answerOptions')}>
            {question.options.map((option, optionIndex) => {
              const isSelected = option.id === selectedOptionId;
              const isCorrectOption = feedback?.correctOptionId === option.id;
              const isIncorrectSelection = Boolean(feedback && isSelected && !isCorrectOption);

              return (
                <Button
                  key={option.id}
                  type='button'
                  variant='outline'
                  disabled={isPending || Boolean(feedback)}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-auto min-h-14 w-full justify-start rounded-2xl border-border bg-field px-4 py-3 text-left whitespace-normal text-surface-foreground shadow-none',
                    !feedback &&
                      isSelected &&
                      'border-primary bg-primary/10 ring-2 ring-primary/25',
                    isCorrectOption &&
                      'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    isIncorrectSelection &&
                      'border-danger bg-danger/10 text-danger line-through decoration-danger/60',
                  )}
                  onClick={() => {
                    setSelectedOptionId(option.id);
                    setError('');
                  }}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-xs font-semibold',
                      isSelected &&
                        !feedback &&
                        'border-primary bg-primary text-primary-foreground',
                      isCorrectOption && 'border-emerald-500 bg-emerald-500 text-white',
                      isIncorrectSelection && 'border-danger bg-danger text-danger-foreground',
                    )}
                  >
                    {isCorrectOption ? (
                      <Check aria-hidden='true' className='size-4' />
                    ) : isIncorrectSelection ? (
                      <XCircle aria-hidden='true' className='size-4' />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </span>
                  <span lang={option.language}>{option.label}</span>
                </Button>
              );
            })}
          </div>

          <div className='mt-5 min-h-20'>
            {feedback && (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-4 py-3',
                  feedback.isCorrect
                    ? 'border-emerald-500/35 bg-emerald-500/10'
                    : 'border-danger/30 bg-danger/8',
                )}
                role='status'
                aria-live='polite'
              >
                {feedback.isCorrect ? (
                  <CheckCircle2
                    aria-hidden='true'
                    className='mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400'
                  />
                ) : (
                  <XCircle aria-hidden='true' className='mt-0.5 size-5 shrink-0 text-danger' />
                )}
                <div>
                  <p className='font-semibold text-surface-foreground'>
                    {feedback.isCorrect ? t('correct') : t('notQuite')}
                  </p>
                  {!feedback.isCorrect && (
                    <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                      {t('correction', {
                        meaning: feedback.meaning,
                        word: feedback.word,
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
            {error && (
              <p
                className='rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger'
                role='alert'
              >
                {error}
              </p>
            )}
          </div>

          {feedback ? (
            <Button type='button' className='h-12 w-full rounded-full' onClick={continuePractice}>
              {nextPhase === LESSON_PHASE.CONVERSATION ? t('startConversation') : t('continue')}
              <ArrowRight aria-hidden='true' />
            </Button>
          ) : (
            <Button
              type='button'
              className='h-12 w-full rounded-full'
              disabled={!selectedOptionId || isPending}
              onClick={submitAnswer}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden='true'
                    className='animate-spin motion-reduce:animate-none'
                  />
                  {t('checking')}
                </>
              ) : (
                t('checkAnswer')
              )}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
