export const FIRST_LESSON_KEY = 'learning-momentum';

export type LessonDefinition = {
  key: string;
  wordIds: readonly number[];
};

const lessonCatalog = [
  {
    key: FIRST_LESSON_KEY,
    wordIds: [8, 9, 10, 7, 11, 16],
  },
] as const satisfies readonly LessonDefinition[];

export function getLessonDefinition(lessonKey: string) {
  return lessonCatalog.find((lesson) => lesson.key === lessonKey) ?? null;
}
