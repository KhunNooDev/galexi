import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { words } from '@/db/schema';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';

const lessonWordColumns = {
  exampleSentence: words.exampleSentence,
  exampleSentenceMeaningTh: words.exampleSentenceMeaningTh,
  id: words.id,
  meaningsTh: words.meaningsTh,
  partOfSpeech: words.partOfSpeech,
  pronunciationIpa: words.pronunciationIpa,
  pronunciationThai: words.pronunciationThai,
  word: words.word,
};

export type LessonWord = {
  exampleSentence: string;
  exampleSentenceMeaningTh: string;
  id: number;
  meaningsTh: string[];
  partOfSpeech: string;
  pronunciationIpa: string;
  pronunciationThai: string;
  word: string;
};

export async function getPublishedLessonWords(lesson: LessonDefinition): Promise<LessonWord[]> {
  const lessonWords = await getDatabase()
    .select(lessonWordColumns)
    .from(words)
    .where(and(inArray(words.id, [...lesson.wordIds]), eq(words.isPublic, true)));
  const wordsById = new Map(lessonWords.map((word) => [word.id, word]));
  const orderedWords = lesson.wordIds.map((wordId) => wordsById.get(wordId));

  if (orderedWords.some((word) => word === undefined)) {
    throw new Error('Lesson content is unavailable');
  }

  return orderedWords as LessonWord[];
}
