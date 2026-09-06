import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, CheckCircle2, CircleCheck, Clock3, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IDENTITY_KIND } from '@/constants/identity';
import { getLessonResultRoute, ROUTES } from '@/constants/routes';
import {
  CONTINUATION_KIND,
  type LearningContinuation,
} from '@/features/learning/learning-continuation';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { getCurrentLearningHome } from '@/features/learning/server/learning-home.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LearningHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string | string[] }>;
}) {
  const [identity, t, tLessons] = await Promise.all([
    getCurrentIdentity(),
    getTranslations('learning.home'),
    getTranslations('learning.lessons'),
  ]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const home = await getCurrentLearningHome();
  const { saved } = await searchParams;
  const progressSaved = (Array.isArray(saved) ? saved[0] : saved) === '1';
  const continuationLesson = home.continuation.lessonKey
    ? getLessonDefinition(home.continuation.lessonKey)
    : null;
  const recentLesson = home.recentLesson ? getLessonDefinition(home.recentLesson.lessonKey) : null;
  const continuationTitle = continuationLesson
    ? tLessons(continuationLesson.titleKey)
    : t(
        home.continuation.kind === CONTINUATION_KIND.ONBOARDING ? 'setupTitle' : 'allCompleteTitle',
      );

  return (
    <main className='relative min-h-[calc(100svh-4rem)] overflow-x-clip bg-background pb-24 lg:pb-0'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/3 size-96 rounded-full bg-primary/12 blur-3xl' />
        <div className='absolute right-0 bottom-0 size-80 rounded-full bg-cyan-400/7 blur-3xl' />
      </div>
      <div className='relative mx-auto min-h-[calc(100svh-4rem)] max-w-7xl'>
        <section className='mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12'>
          {progressSaved && (
            <p
              className='mb-5 flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm font-medium text-surface-foreground'
              role='status'
            >
              <CircleCheck aria-hidden='true' className='size-5 text-primary' />
              {t('progressSaved')}
            </p>
          )}
          <div>
            <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>
              {t('eyebrow')}
            </p>
            <h1 className='mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
              {t('title')}
            </h1>
            <p className='mt-2 max-w-xl leading-7 text-muted-foreground'>{t('description')}</p>
          </div>

          <div className='mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.75fr]'>
            <section className='galexi-panel overflow-hidden'>
              <div className='bg-primary/6 p-6 sm:p-8'>
                <span className='grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20'>
                  {home.continuation.kind === CONTINUATION_KIND.COMPLETE ? (
                    <CheckCircle2 aria-hidden='true' className='size-6' />
                  ) : (
                    <BookOpen aria-hidden='true' className='size-6' />
                  )}
                </span>
                <p className='mt-5 text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
                  {getContinuationEyebrow(home.continuation, t)}
                </p>
                <h2 className='mt-2 text-2xl font-semibold text-surface-foreground sm:text-3xl'>
                  {continuationTitle}
                </h2>
                <p className='mt-2 max-w-xl text-sm leading-6 text-muted-foreground'>
                  {getContinuationDescription(home.continuation, t)}
                </p>

                {home.continuation.kind !== CONTINUATION_KIND.ONBOARDING && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground'>
                      <span>{t('progress')}</span>
                      <span>{home.continuation.progress}%</span>
                    </div>
                    <div
                      className='mt-2 h-2 overflow-hidden rounded-full bg-secondary-hover'
                      role='progressbar'
                      aria-label={t('progress')}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={home.continuation.progress}
                    >
                      <div
                        className='h-full rounded-full bg-primary'
                        style={{ width: `${home.continuation.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {home.continuation.href ? (
                  <Button asChild className='mt-7 h-12 rounded-full px-7'>
                    <Link href={home.continuation.href}>
                      {getContinuationAction(home.continuation, t)}
                      <ArrowRight aria-hidden='true' />
                    </Link>
                  </Button>
                ) : (
                  <p className='mt-7 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary'>
                    <Sparkles aria-hidden='true' className='size-4' />
                    {t('moreLessonsSoon')}
                  </p>
                )}
              </div>
            </section>

            <aside className='grid grid-cols-2 gap-4 lg:grid-cols-1'>
              <HomeMetric label={t('lessonsCompleted')} value={home.completedLessonCount} />
              <HomeMetric label={t('wordsPracticed')} value={home.wordsPracticed} />
            </aside>
          </div>

          {home.recentLesson && recentLesson && (
            <section className='galexi-panel mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div className='flex min-w-0 items-start gap-3'>
                <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                  <Clock3 aria-hidden='true' className='size-5' />
                </span>
                <div className='min-w-0'>
                  <p className='text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
                    {t('recentLesson')}
                  </p>
                  <h2 className='mt-1 truncate font-semibold text-surface-foreground'>
                    {tLessons(recentLesson.titleKey)}
                  </h2>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('recentScore', { score: home.recentLesson.score })}
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Button asChild className='rounded-full'>
                  <Link
                    href={`${getLessonResultRoute(home.recentLesson.lessonKey, home.recentLesson.sessionId)}#review`}
                  >
                    {t('reviewVocabulary')}
                  </Link>
                </Button>
                <Button asChild className='rounded-full' variant='outline'>
                  <Link
                    href={getLessonResultRoute(
                      home.recentLesson.lessonKey,
                      home.recentLesson.sessionId,
                    )}
                  >
                    {t('viewResult')}
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {identity.kind === IDENTITY_KIND.GUEST && (
            <section className='mt-5 rounded-3xl border border-border bg-surface/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6'>
              <div>
                <h2 className='font-semibold text-surface-foreground'>{t('guestTitle')}</h2>
                <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                  {t('guestDescription')}
                </p>
              </div>
              <Button asChild className='mt-4 shrink-0 rounded-full sm:mt-0' variant='outline'>
                <Link href={ROUTES.LEARN_SAVE}>{t('createAccount')}</Link>
              </Button>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function HomeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className='galexi-panel flex min-h-28 flex-col justify-center p-5'>
      <p className='text-3xl font-semibold text-surface-foreground'>{value}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{label}</p>
    </div>
  );
}

type HomeTranslations = Awaited<ReturnType<typeof getTranslations<'learning.home'>>>;

function getContinuationEyebrow(continuation: LearningContinuation, t: HomeTranslations) {
  if (continuation.kind === CONTINUATION_KIND.COMPLETE) return t('completeEyebrow');
  if (continuation.kind === CONTINUATION_KIND.ONBOARDING) return t('setupEyebrow');
  if (continuation.progress === 0) return t('startEyebrow');
  return t('continueEyebrow');
}

function getContinuationDescription(continuation: LearningContinuation, t: HomeTranslations) {
  if (continuation.kind === CONTINUATION_KIND.COMPLETE) return t('allCompleteDescription');
  if (continuation.kind === CONTINUATION_KIND.ONBOARDING) return t('setupDescription');
  if (continuation.kind === CONTINUATION_KIND.RESULT) return t('resultDescription');
  return t('lessonDescription');
}

function getContinuationAction(continuation: LearningContinuation, t: HomeTranslations) {
  if (continuation.kind === CONTINUATION_KIND.ONBOARDING) return t('finishSetup');
  if (continuation.kind === CONTINUATION_KIND.RESULT) return t('viewResult');
  if (continuation.progress === 0) return t('startLesson');
  return t('continueLesson');
}
