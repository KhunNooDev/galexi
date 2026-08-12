'use server';

import { getTranslations } from 'next-intl/server';

import { advanceLessonInputSchema } from '@/features/learning/lesson.schema';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { getPublishedLessonWords } from '@/features/learning/server/lesson.service';
import { advanceCurrentLesson } from '@/features/learning/server/lesson-session.service';

export type AdvanceLessonActionResult =
  | {
      ok: true;
      phase: 'learn' | 'practice';
      wordIndex: number;
    }
  | { error: string; ok: false };

export async function advanceLessonAction(input: unknown): Promise<AdvanceLessonActionResult> {
  const t = await getTranslations('learning.lesson');
  const result = advanceLessonInputSchema.safeParse(input);

  if (!result.success) {
    return { error: t('saveError'), ok: false };
  }

  const lesson = getLessonDefinition(result.data.lessonKey);

  if (!lesson) {
    return { error: t('unavailable'), ok: false };
  }

  try {
    await getPublishedLessonWords(lesson);
    const session = await advanceCurrentLesson(lesson, result.data);

    return {
      ok: true,
      phase: session.state.phase,
      wordIndex: session.state.wordIndex,
    };
  } catch (error) {
    console.error('Unable to advance lesson', error);
    return { error: t('saveError'), ok: false };
  }
}
