'use server';

import { getTranslations } from 'next-intl/server';

import {
  advanceLessonInputSchema,
  type LessonPhase,
  submitConversationResponseInputSchema,
  submitPracticeAnswerInputSchema,
} from '@/features/learning/lesson.schema';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { submitCurrentConversationResponse } from '@/features/learning/server/conversation.service';
import { getPublishedLessonWords } from '@/features/learning/server/lesson.service';
import { advanceCurrentLesson } from '@/features/learning/server/lesson-session.service';
import { submitCurrentPracticeAnswer } from '@/features/learning/server/practice.service';

type AdvanceLessonActionResult =
  | {
      ok: true;
      phase: LessonPhase;
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

type SubmitPracticeAnswerActionResult =
  | {
      feedback: {
        correctOptionId: string;
        isCorrect: boolean;
        meaning: string;
        word: string;
      };
      ok: true;
      phase: LessonPhase;
    }
  | { error: string; ok: false };

export async function submitPracticeAnswerAction(
  input: unknown,
): Promise<SubmitPracticeAnswerActionResult> {
  const t = await getTranslations('learning.lesson.practice');
  const result = submitPracticeAnswerInputSchema.safeParse(input);

  if (!result.success) {
    return { error: t('invalidAnswer'), ok: false };
  }

  const lesson = getLessonDefinition(result.data.lessonKey);

  if (!lesson) {
    return { error: t('unavailable'), ok: false };
  }

  try {
    const words = await getPublishedLessonWords(lesson);
    const submission = await submitCurrentPracticeAnswer(lesson, words, result.data);

    return {
      feedback: submission.feedback,
      ok: true,
      phase: submission.state.phase,
    };
  } catch (error) {
    console.error('Unable to score practice answer', error);
    return { error: t('saveError'), ok: false };
  }
}

type SubmitConversationResponseActionResult =
  { ok: true; phase: LessonPhase } | { error: string; ok: false };

export async function submitConversationResponseAction(
  input: unknown,
): Promise<SubmitConversationResponseActionResult> {
  const t = await getTranslations('learning.lesson.conversation');
  const result = submitConversationResponseInputSchema.safeParse(input);

  if (!result.success) {
    return { error: t('invalidResponse'), ok: false };
  }

  const lesson = getLessonDefinition(result.data.lessonKey);

  if (!lesson) {
    return { error: t('unavailable'), ok: false };
  }

  try {
    const words = await getPublishedLessonWords(lesson);
    const submission = await submitCurrentConversationResponse(lesson, words, result.data);

    return { ok: true, phase: submission.state.phase };
  } catch (error) {
    console.error('Unable to save conversation response', error);
    return { error: t('saveError'), ok: false };
  }
}
