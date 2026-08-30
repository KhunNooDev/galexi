import {
  type ConversationTurn,
  FIRST_LESSON_CONVERSATION,
} from '@/features/learning/lessons/lesson-activities';

export const FIRST_LESSON_KEY = 'learning-momentum';

export type LessonDefinition = {
  conversation: readonly ConversationTurn[];
  key: string;
  titleKey: 'learningMomentum';
  wordSenseIds: readonly number[];
};

const lessonCatalog = [
  {
    conversation: FIRST_LESSON_CONVERSATION,
    key: FIRST_LESSON_KEY,
    titleKey: 'learningMomentum',
    wordSenseIds: [8, 9, 10, 7, 11, 16],
  },
] as const satisfies readonly LessonDefinition[];

export function getFirstLessonDefinition(): LessonDefinition {
  return lessonCatalog[0];
}

export function getLessonDefinition(lessonKey: string) {
  return lessonCatalog.find((lesson) => lesson.key === lessonKey) ?? null;
}

export function getNextLessonDefinition(lessonKey: string): LessonDefinition | null {
  const lessonIndex = lessonCatalog.findIndex((lesson) => lesson.key === lessonKey);

  return lessonIndex < 0 ? null : (lessonCatalog[lessonIndex + 1] ?? null);
}
