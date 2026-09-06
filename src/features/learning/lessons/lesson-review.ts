import { buildPracticeQuestions } from '@/features/learning/lessons/lesson-activities';

export type ReviewWord = { id: number; meaning: string; word: string };

export function buildReviewQuestions(
  words: readonly ReviewWord[],
  missedWordSenseIds: readonly number[],
  mode: 'all' | 'missed',
) {
  // Build distractors from the whole lesson before selecting the missed questions.
  const questions = buildPracticeQuestions(
    words.map((word) => ({ ...word, meaningsTh: [word.meaning] })),
    [],
  );
  return mode === 'all'
    ? questions
    : questions.filter((question) => missedWordSenseIds.includes(question.targetWordSenseId));
}
