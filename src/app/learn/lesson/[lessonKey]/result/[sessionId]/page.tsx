import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BookOpenCheck, CheckCircle2, MessageCircle, Target } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { IDENTITY_KIND } from '@/constants/identity';
import { ROUTES } from '@/constants/routes';
import { LessonReview } from '@/features/learning/components/lesson-review';
import { lessonResultParamsSchema } from '@/features/learning/lesson.schema';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { completeAndGetLessonResult } from '@/features/learning/server/lesson-result.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LessonResultPage({
  params,
}: {
  params: Promise<{ lessonKey: string; sessionId: string }>;
}) {
  const [routeParams, identity, t, tLessons] = await Promise.all([
    params,
    getCurrentIdentity(),
    getTranslations('learning.result'),
    getTranslations('learning.lessons'),
  ]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const parsedParams = lessonResultParamsSchema.safeParse(routeParams);

  if (!parsedParams.success) {
    notFound();
  }

  const { lessonKey, sessionId } = parsedParams.data;
  const lesson = getLessonDefinition(lessonKey);

  if (!lesson) {
    notFound();
  }

  const result = await completeAndGetLessonResult(lesson, sessionId);

  if (!result) {
    notFound();
  }

  const completedDate = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(result.completedAt));

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl' />
        <div className='absolute right-0 bottom-0 size-72 rounded-full bg-cyan-400/7 blur-3xl' />
      </div>
      <div className='relative mx-auto min-h-svh max-w-7xl'>
        <PageHeader brand identity={identity} />
        <section className='mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12'>
          <div className='galexi-panel overflow-hidden'>
            <div className='border-b border-border bg-primary/5 px-6 py-8 text-center sm:px-10'>
              <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20'>
                <CheckCircle2 aria-hidden='true' className='size-7' />
              </span>
              <p className='mt-5 text-xs font-semibold tracking-[0.16em] text-primary uppercase'>
                {t('eyebrow')}
              </p>
              <h1 className='mt-2 text-3xl font-semibold tracking-tight text-surface-foreground sm:text-4xl'>
                {t('title')}
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                {t('lessonCompleted', {
                  date: completedDate,
                  lesson: tLessons(lesson.titleKey),
                })}
              </p>
            </div>

            <div className='space-y-7 p-5 sm:p-8'>
              <div className='grid grid-cols-3 gap-3'>
                <ResultMetric
                  icon={<Target aria-hidden='true' />}
                  label={t('accuracy')}
                  value={`${result.accuracy}%`}
                />
                <ResultMetric
                  icon={<BookOpenCheck aria-hidden='true' />}
                  label={t('practice')}
                  value={t('correctCount', {
                    correct: result.practiceCorrect,
                    total: result.practiceTotal,
                  })}
                />
                <ResultMetric
                  icon={<MessageCircle aria-hidden='true' />}
                  label={t('conversation')}
                  value={t('turnCount', { count: result.conversationTurns })}
                />
              </div>

              <section>
                <div className='flex items-end justify-between gap-4'>
                  <div>
                    <h2 className='text-lg font-semibold text-surface-foreground'>
                      {t('vocabularyTitle')}
                    </h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t('vocabularyDescription')}
                    </p>
                  </div>
                </div>
                <ul className='mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-field'>
                  {result.words.map((word) => (
                    <li
                      key={word.id}
                      className='flex items-center justify-between gap-4 px-4 py-3.5'
                    >
                      <div className='min-w-0'>
                        <p className='truncate font-semibold text-surface-foreground'>
                          {word.word}
                        </p>
                        <p className='mt-0.5 truncate text-sm text-muted-foreground' lang='th'>
                          {word.meaning}
                        </p>
                      </div>
                      <span className='shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
                        {t(`mastery.${word.label}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <LessonReview
                key={sessionId}
                words={result.words}
                missedWordSenseIds={result.missedWordSenseIds}
              />

              <div className='border-t border-border pt-6'>
                <Button asChild className='h-12 w-full rounded-full sm:w-auto sm:px-7'>
                  <Link href={ROUTES.LEARN_HOME}>{t('continue')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='rounded-2xl border border-border bg-field p-3 text-center sm:p-4'>
      <span className='mx-auto flex size-8 items-center justify-center text-primary [&>svg]:size-4'>
        {icon}
      </span>
      <p className='mt-1 text-lg font-semibold text-surface-foreground sm:text-xl'>{value}</p>
      <p className='mt-0.5 text-xs text-muted-foreground'>{label}</p>
    </div>
  );
}
