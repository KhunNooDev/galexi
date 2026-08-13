'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Bot, LoaderCircle, MessageCircle, Send, UserRound } from 'lucide-react';

import { submitConversationResponseAction } from '@/app/learn/lesson/[lessonKey]/actions';
import { Button } from '@/components/ui/button';
import { type LessonPhase } from '@/features/learning/lesson.schema';
import type { ConversationTurn } from '@/features/learning/lessons/lesson-activities';
import { cn } from '@/lib/utils';

type SavedConversationResponse = {
  responseId: string;
  turnId: string;
};

type ConversationPlayerProps = {
  initialResponses: SavedConversationResponse[];
  lessonKey: string;
  onPhaseChange: (phase: LessonPhase) => void;
  sessionId: string;
  turns: readonly ConversationTurn[];
};

export function ConversationPlayer({
  initialResponses,
  lessonKey,
  onPhaseChange,
  sessionId,
  turns,
}: ConversationPlayerProps) {
  const t = useTranslations('learning.lesson.conversation');
  const [responses, setResponses] = useState(initialResponses);
  const [selectedResponseId, setSelectedResponseId] = useState('');
  const [completedPhase, setCompletedPhase] = useState<LessonPhase | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const currentTurn = turns[responses.length];
  const progress = currentTurn ? ((responses.length + 1) / turns.length) * 100 : 100;

  function findResponse(turn: ConversationTurn, responseId: string) {
    return turn.responses.find((response) => response.id === responseId);
  }

  function submitResponse() {
    if (!currentTurn || !selectedResponseId) {
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await submitConversationResponseAction({
        lessonKey,
        responseId: selectedResponseId,
        sessionId,
        turnId: currentTurn.id,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setResponses((current) => {
        if (current.some((response) => response.turnId === currentTurn.id)) {
          return current;
        }

        return [...current, { responseId: selectedResponseId, turnId: currentTurn.id }];
      });
      setSelectedResponseId('');
      setCompletedPhase(result.phase);
    });
  }

  return (
    <section className='mx-auto w-full max-w-2xl'>
      <div className='mb-4 flex items-center justify-between gap-4'>
        <p className='text-sm font-medium text-surface-foreground'>
          {t('progress', {
            current: Math.min(responses.length + 1, turns.length),
            total: turns.length,
          })}
        </p>
        <span className='inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
          <MessageCircle aria-hidden='true' className='size-4' />
          {t('phase')}
        </span>
      </div>
      <div
        className='mb-5 h-2 overflow-hidden rounded-full bg-secondary-hover'
        role='progressbar'
        aria-label={t('progressLabel')}
        aria-valuemax={turns.length}
        aria-valuemin={1}
        aria-valuenow={Math.min(responses.length + 1, turns.length)}
      >
        <div
          className='h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none'
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className='galexi-panel overflow-hidden'>
        <div className='border-b border-border bg-primary/5 px-5 py-5 sm:px-7'>
          <p className='text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
            {t('contextEyebrow')}
          </p>
          <h2 className='mt-2 text-xl font-semibold text-surface-foreground sm:text-2xl'>
            {t('title')}
          </h2>
          <p className='mt-1 text-sm leading-6 text-muted-foreground'>{t('description')}</p>
        </div>

        <div className='p-5 sm:p-7'>
          <div
            className='flex max-h-80 scrollbar-none flex-col gap-4 overflow-y-auto'
            aria-label={t('transcriptLabel')}
          >
            {responses.map((savedResponse, index) => {
              const turn = turns[index];
              const response = turn && findResponse(turn, savedResponse.responseId);

              if (!turn || !response) {
                return null;
              }

              return (
                <ConversationExchange
                  key={turn.id}
                  message={t(turn.messageKey)}
                  response={t(response.messageKey)}
                />
              );
            })}

            {currentTurn && (
              <div className='flex items-start gap-3' aria-live='polite'>
                <span className='grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground'>
                  <Bot aria-hidden='true' className='size-4' />
                </span>
                <div className='max-w-[85%] rounded-3xl rounded-tl-md bg-secondary-hover px-4 py-3 text-sm leading-6 text-surface-foreground'>
                  {t(currentTurn.messageKey)}
                </div>
              </div>
            )}
          </div>

          {currentTurn ? (
            <div className='mt-6 border-t border-border pt-5'>
              <p className='text-sm font-semibold text-surface-foreground'>{t('chooseResponse')}</p>
              <div className='mt-3 grid gap-3' role='group' aria-label={t('responseOptions')}>
                {currentTurn.responses.map((response) => {
                  const isSelected = selectedResponseId === response.id;

                  return (
                    <Button
                      key={response.id}
                      type='button'
                      variant='outline'
                      disabled={isPending}
                      aria-pressed={isSelected}
                      className={cn(
                        'h-auto min-h-14 justify-start rounded-2xl border-border bg-field px-4 py-3 text-left whitespace-normal text-surface-foreground shadow-none',
                        isSelected && 'border-primary bg-primary/10 ring-2 ring-primary/25',
                      )}
                      onClick={() => {
                        setSelectedResponseId(response.id);
                        setError('');
                      }}
                    >
                      <UserRound aria-hidden='true' className='size-4 shrink-0 text-primary' />
                      {t(response.messageKey)}
                    </Button>
                  );
                })}
              </div>

              {error && (
                <p
                  className='mt-4 rounded-2xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger'
                  role='alert'
                >
                  {error}
                </p>
              )}

              <Button
                type='button'
                className='mt-5 h-12 w-full rounded-full'
                disabled={!selectedResponseId || isPending}
                onClick={submitResponse}
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      aria-hidden='true'
                      className='animate-spin motion-reduce:animate-none'
                    />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send aria-hidden='true' />
                    {t('send')}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className='mt-6 rounded-3xl border border-primary/25 bg-primary/7 p-5 text-center'>
              <p className='font-semibold text-surface-foreground'>{t('completeTitle')}</p>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                {t('completeDescription')}
              </p>
              <Button
                type='button'
                className='mt-4 h-11 rounded-full px-6'
                onClick={() => completedPhase && onPhaseChange(completedPhase)}
              >
                {t('continue')}
                <ArrowRight aria-hidden='true' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ConversationExchange({ message, response }: { message: string; response: string }) {
  return (
    <div className='space-y-3'>
      <div className='flex items-start gap-3'>
        <span className='grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground'>
          <Bot aria-hidden='true' className='size-4' />
        </span>
        <div className='max-w-[85%] rounded-3xl rounded-tl-md bg-secondary-hover px-4 py-3 text-sm leading-6 text-surface-foreground'>
          {message}
        </div>
      </div>
      <div className='flex items-start justify-end gap-3'>
        <div className='max-w-[85%] rounded-3xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground'>
          {response}
        </div>
        <span className='grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary'>
          <UserRound aria-hidden='true' className='size-4' />
        </span>
      </div>
    </div>
  );
}
