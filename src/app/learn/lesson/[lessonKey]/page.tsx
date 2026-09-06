import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { IDENTITY_KIND } from '@/constants/identity';
import { getLessonResultRoute, ROUTES } from '@/constants/routes';
import { LessonPlayer } from '@/features/learning/components/lesson-player';
import { LESSON_PHASE } from '@/features/learning/lesson.schema';
import {
  buildPracticeQuestions,
  toPracticeQuestionView,
} from '@/features/learning/lessons/lesson-activities';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import {
  ensureCurrentLearningOnboardingComplete,
  getOrCreateCurrentLearningProfile,
} from '@/features/learning/server/learning-profile.service';
import { getPublishedLessonWords } from '@/features/learning/server/lesson.service';
import { getOrCreateCurrentLessonSession } from '@/features/learning/server/lesson-session.service';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export default async function LessonPage({ params }: { params: Promise<{ lessonKey: string }> }) {
  const { lessonKey } = await params;
  const lesson = getLessonDefinition(lessonKey);

  if (!lesson) {
    notFound();
  }

  const [identity, t] = await Promise.all([
    getCurrentIdentity(),
    getTranslations('learning.lesson'),
  ]);

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    redirect(ROUTES.LEARN_START);
  }

  const profile = await getOrCreateCurrentLearningProfile();

  if (!profile.goal) {
    redirect(ROUTES.LEARN_GOAL);
  }

  if (!profile.level) {
    redirect(ROUTES.LEARN_LEVEL);
  }

  await ensureCurrentLearningOnboardingComplete();
  const words = await getPublishedLessonWords(lesson);
  const practiceQuestions = buildPracticeQuestions(words, lesson.conversation);
  const session = await getOrCreateCurrentLessonSession(lesson);

  if (session.state.phase === LESSON_PHASE.RESULT) {
    redirect(getLessonResultRoute(lesson.key, session.id));
  }

  return (
    <main className='relative min-h-svh overflow-x-clip bg-background'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl' />
        <div className='absolute right-0 bottom-0 size-72 rounded-full bg-cyan-400/7 blur-3xl' />
      </div>
      <div className='relative mx-auto flex min-h-svh max-w-7xl flex-col'>
        <PageHeader
          backHref={ROUTES.LEARN_HOME}
          backLabel={t('backToLearning')}
          identity={identity}
        />
        <section className='flex flex-1 flex-col items-center px-5 py-7 sm:px-8 sm:py-10'>
          <div className='mb-6 w-full max-w-xl text-center'>
            <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>
              {t('eyebrow')}
            </p>
            <h1 className='mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
              {t('title')}
            </h1>
            <p className='mt-2 text-sm leading-6 text-muted-foreground'>{t('description')}</p>
          </div>
          <LessonPlayer
            conversation={lesson.conversation}
            initialState={session.state}
            lessonKey={lesson.key}
            practiceQuestions={practiceQuestions.map(toPracticeQuestionView)}
            sessionId={session.id}
            words={words}
          />
        </section>
      </div>
    </main>
  );
}
