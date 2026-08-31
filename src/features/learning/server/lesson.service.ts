import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { words, wordSenses } from '@/db/schema';
import type { LessonWord } from '@/features/learning/lesson.schema';
import type { LessonDefinition } from '@/features/learning/lessons/lesson-catalog';

const lessonWordColumns = {
  exampleSentence: wordSenses.exampleSentence,
  exampleSentenceMeaningTh: wordSenses.exampleSentenceMeaningTh,
  id: wordSenses.id,
  meaningsTh: wordSenses.meaningsTh,
  partOfSpeech: wordSenses.partOfSpeech,
  pronunciationIpa: wordSenses.pronunciationIpa,
  pronunciationThai: wordSenses.pronunciationThai,
  word: words.word,
};

export async function getPublishedLessonWords(lesson: LessonDefinition): Promise<LessonWord[]> {
  const lessonWords = await getDatabase()
    .select(lessonWordColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .where(and(inArray(wordSenses.id, [...lesson.wordSenseIds]), eq(wordSenses.isPublic, true)));
  const wordsById = new Map(lessonWords.map((word) => [word.id, word]));
  const orderedWords = lesson.wordSenseIds.map((wordSenseId) => wordsById.get(wordSenseId));

  if (orderedWords.some((word) => word === undefined)) {
    throw new Error('Lesson content is unavailable');
  }

  return orderedWords as LessonWord[];
}
