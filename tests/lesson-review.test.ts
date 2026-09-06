import { describe, expect, it } from 'bun:test';

import { buildReviewQuestions } from '@/features/learning/lessons/lesson-review';

const words = [
  { id: 8, meaning: 'อยากรู้อยากเห็น', word: 'curious' },
  { id: 9, meaning: 'ปรับปรุง', word: 'improve' },
  { id: 10, meaning: 'โอกาส', word: 'opportunity' },
  { id: 7, meaning: 'ทำสำเร็จ', word: 'accomplish' },
];

describe('lesson review', () => {
  it('reviews one missed word with distractors from the full lesson', () => {
    const questions = buildReviewQuestions(words, [8], 'missed');
    expect(questions).toHaveLength(1);
    expect(questions[0].targetWordSenseId).toBe(8);
    expect(questions[0].options).toHaveLength(4);
    expect(
      questions[0].options.find((option) => option.id === questions[0].correctOptionId)?.label,
    ).toBe('curious');
  });

  it('allows all-word practice after a perfect score without changing the source', () => {
    const original = structuredClone(words);
    expect(buildReviewQuestions(words, [], 'missed')).toEqual([]);
    expect(buildReviewQuestions(words, [], 'all')).toHaveLength(4);
    expect(words).toEqual(original);
  });

  it('ignores stale missed IDs and does not duplicate questions', () => {
    expect(
      buildReviewQuestions(words, [8, 8, 999], 'missed').map(
        (question) => question.targetWordSenseId,
      ),
    ).toEqual([8]);
  });
});
