import {
  type ConversationTurn,
  FIRST_LESSON_CONVERSATION,
} from '@/features/learning/lessons/lesson-activities';

export const FIRST_LESSON_KEY = 'learning-momentum';

export type LessonDefinition = {
  conversation: readonly ConversationTurn[];
  key: string;
  wordIds: readonly number[];
};

const lessonCatalog = [
  {
    conversation: FIRST_LESSON_CONVERSATION,
    key: FIRST_LESSON_KEY,
    wordIds: [8, 9, 10, 7, 11, 16],
  },
] as const satisfies readonly LessonDefinition[];

export function getLessonDefinition(lessonKey: string) {
  return lessonCatalog.find((lesson) => lesson.key === lessonKey) ?? null;
}
