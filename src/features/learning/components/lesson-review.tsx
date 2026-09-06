'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { buildReviewQuestions, type ReviewWord } from '@/features/learning/lessons/lesson-review';
import { cn } from '@/lib/utils';

export function LessonReview({
  words,
  missedWordSenseIds,
}: {
  words: ReviewWord[];
  missedWordSenseIds: number[];
}) {
  const t = useTranslations('learning.review');
  const practice = useTranslations('learning.lesson.practice');
  const [mode, setMode] = useState<'all' | 'missed' | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const questions = mode ? buildReviewQuestions(words, missedWordSenseIds, mode) : [];
  const question = questions[index];

  function start(nextMode: 'all' | 'missed') {
    setMode(nextMode);
    setIndex(0);
    setSelected('');
    setChecked(false);
    setCorrect(0);
  }

  return (
    <section
      id='review'
      className='scroll-mt-24 space-y-4 border-t border-border pt-6'
      aria-labelledby='review-title'
    >
      <h2 id='review-title' className='text-xl font-semibold'>
        {t('title')}
      </h2>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      {!mode ? (
        <div className='flex flex-wrap gap-3'>
          {missedWordSenseIds.length > 0 && (
            <Button className='rounded-full' onClick={() => start('missed')}>
              {t('missed')}
            </Button>
          )}
          <Button variant='outline' className='rounded-full' onClick={() => start('all')}>
            {t('all')}
          </Button>
        </div>
      ) : question ? (
        <div className='space-y-4 rounded-2xl border border-border bg-field p-4 sm:p-6'>
          <p className='text-sm text-muted-foreground'>
            {practice('progress', { current: index + 1, total: questions.length })}
          </p>
          <h3 className='text-lg font-semibold'>
            {question.kind === 'meaning-to-word'
              ? practice('meaningToWordPrompt', { meaning: question.promptValue })
              : practice('wordToMeaningPrompt', { word: question.promptValue })}
          </h3>
          <div className='grid gap-3' role='group' aria-label={practice('answerOptions')}>
            {question.options.map((option) => (
              <Button
                key={option.id}
                variant='outline'
                disabled={checked}
                aria-pressed={selected === option.id}
                className={cn(
                  'h-auto min-h-12 justify-start text-left whitespace-normal',
                  selected === option.id && 'border-primary bg-primary/10',
                  checked &&
                    option.id === question.correctOptionId &&
                    'border-emerald-500 bg-emerald-500/10',
                )}
                onClick={() => setSelected(option.id)}
              >
                <span lang={option.language}>{option.label}</span>
              </Button>
            ))}
          </div>
          {checked && (
            <div role='status' className='rounded-xl border border-border p-3'>
              <p className='font-semibold'>
                {practice(selected === question.correctOptionId ? 'correct' : 'notQuite')}
              </p>
              {selected !== question.correctOptionId && (
                <p className='mt-1 text-sm'>
                  {practice('correction', {
                    word: question.targetWordText,
                    meaning: question.targetWordMeaning,
                  })}
                </p>
              )}
            </div>
          )}
          <Button
            className='w-full rounded-full'
            disabled={!selected}
            onClick={() => {
              if (checked) {
                setIndex(index + 1);
                setSelected('');
                setChecked(false);
              } else {
                setCorrect(correct + Number(selected === question.correctOptionId));
                setChecked(true);
              }
            }}
          >
            {checked ? practice('continue') : practice('checkAnswer')}
          </Button>
          <Button variant='ghost' onClick={() => setMode(null)}>
            {t('back')}
          </Button>
        </div>
      ) : (
        <div className='space-y-3 rounded-2xl border border-border bg-field p-5'>
          <p role='status' className='font-semibold'>
            {t('complete', { correct, total: questions.length })}
          </p>
          <Button variant='outline' className='rounded-full' onClick={() => start(mode)}>
            {t('again')}
          </Button>
          <Button variant='ghost' onClick={() => setMode(null)}>
            {t('back')}
          </Button>
        </div>
      )}
    </section>
  );
}
