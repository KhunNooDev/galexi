import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { userWordProgress, words, wordSenseCategories, wordSenses } from '@/db/schema';
import {
  createInitialLessonState,
  LESSON_PHASE,
  type LessonSessionState,
  normalizeLessonSessionState,
} from '@/features/learning/lesson.schema';
import {
  addPracticeAnswer,
  buildPracticeQuestions,
} from '@/features/learning/lessons/lesson-activities';
import { createLessonResultSnapshot } from '@/features/learning/lessons/lesson-result';

const polysemousSenses = [
  {
    id: 101,
    meaningsTh: ['ธนาคาร'],
    partOfSpeech: 'noun',
    pronunciationIpa: '/bæŋk/',
    senseOrder: 1,
    word: 'bank',
  },
  {
    id: 102,
    meaningsTh: ['ริมฝั่งแม่น้ำ'],
    partOfSpeech: 'noun',
    pronunciationIpa: '/bæŋk/',
    senseOrder: 2,
    word: 'bank',
  },
  {
    id: 103,
    meaningsTh: ['บันทึก'],
    partOfSpeech: 'noun',
    pronunciationIpa: '/ˈrek.ɚd/',
    senseOrder: 1,
    word: 'record',
  },
  {
    id: 104,
    meaningsTh: ['บันทึก', 'อัด'],
    partOfSpeech: 'verb',
    pronunciationIpa: '/rɪˈkɔːrd/',
    senseOrder: 1,
    word: 'record',
  },
  {
    id: 105,
    meaningsTh: ['ฝากเงิน'],
    partOfSpeech: 'verb',
    pronunciationIpa: '/bæŋk/',
    senseOrder: 1,
    word: 'bank',
  },
  {
    id: 106,
    meaningsTh: ['แสง', 'ไฟ'],
    partOfSpeech: 'noun',
    pronunciationIpa: '/laɪt/',
    senseOrder: 1,
    word: 'light',
  },
  {
    id: 107,
    meaningsTh: ['เบา'],
    partOfSpeech: 'adjective',
    pronunciationIpa: '/laɪt/',
    senseOrder: 1,
    word: 'light',
  },
  {
    id: 108,
    meaningsTh: ['จดจ่อ'],
    partOfSpeech: 'verb',
    pronunciationIpa: '/ˈfoʊ.kəs/',
    senseOrder: 1,
    word: 'focus',
  },
] as const;

describe('word sense learning model', () => {
  it('tracks mastery independently for same-spelling, same-part-of-speech senses', () => {
    const questions = buildPracticeQuestions(polysemousSenses, []);
    let state: LessonSessionState = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.PRACTICE,
    };

    for (const question of questions) {
      state = addPracticeAnswer(state, question, question.correctOptionId, questions.length).state;
    }

    state = { ...state, phase: LESSON_PHASE.RESULT };
    const snapshot = createLessonResultSnapshot({
      completedAt: new Date('2026-08-27T00:00:00.000Z'),
      conversation: [],
      masteryByWordSenseId: new Map([
        [101, 90],
        [102, 20],
      ]),
      questions,
      state,
      words: polysemousSenses,
    });

    expect(snapshot.mastery.slice(0, 2)).toEqual([
      { meaning: 'ธนาคาร', value: 90, word: 'bank', wordSenseId: 101 },
      { meaning: 'ริมฝั่งแม่น้ำ', value: 20, word: 'bank', wordSenseId: 102 },
    ]);
  });

  it('keeps every practice answer visually distinct for polysemous words', () => {
    const questions = buildPracticeQuestions(polysemousSenses, []);

    for (const question of questions) {
      const labels = question.options.map((option) => option.label.trim().toLowerCase());
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it('normalizes unfinished legacy session IDs without losing progress', () => {
    const normalized = normalizeLessonSessionState(
      {
        conversation: { responses: [] },
        phase: 'practice',
        practice: {
          answers: [
            {
              isCorrect: true,
              questionId: 'legacy-question',
              selectedOptionId: 'legacy-option',
              wordId: 101,
            },
          ],
        },
        seenWordIds: [101, 102],
        wordIndex: 1,
      },
      [101, 102],
    );

    expect(normalized.practice.answers[0]?.wordSenseId).toBe(101);
    expect(normalized.seenWordSenseIds).toEqual([101, 102]);
    expect(normalized.wordIndex).toBe(1);
  });

  it('resets malformed legacy session entries instead of throwing', () => {
    const normalized = normalizeLessonSessionState(
      {
        conversation: { responses: [] },
        phase: 'practice',
        practice: { answers: [null] },
        result: { mastery: [null] },
        seenWordSenseIds: [101],
        wordIndex: 0,
      },
      [101],
    );

    expect(normalized).toEqual(createInitialLessonState());
  });
});

describe('word sense database schema', () => {
  it('uses canonical spelling and sense-level relationship keys', () => {
    const wordConfig = getTableConfig(words);
    const senseConfig = getTableConfig(wordSenses);
    const progressConfig = getTableConfig(userWordProgress);
    const categoryConfig = getTableConfig(wordSenseCategories);

    expect(wordConfig.columns.map((column) => column.name)).toEqual([
      'id',
      'created_by',
      'updated_by',
      'word',
      'created_at',
      'updated_at',
    ]);
    const identityIndex = senseConfig.indexes.find(
      (index) => index.config.name === 'word_senses_word_part_order_unique',
    );

    expect(identityIndex?.config.unique).toBe(true);
    expect(identityIndex?.config.columns).toHaveLength(3);
    expect(senseConfig.checks.map((check) => check.name)).toContain(
      'word_senses_sense_order_check',
    );
    expect(progressConfig.columns.map((column) => column.name)).toContain('word_sense_id');
    expect(progressConfig.columns.map((column) => column.name)).not.toContain('word_id');
    expect(categoryConfig.columns.map((column) => column.name)).toContain('word_sense_id');
    expect(wordConfig.enableRLS).toBe(true);
    expect(senseConfig.enableRLS).toBe(true);
    expect(categoryConfig.enableRLS).toBe(true);
    expect(progressConfig.enableRLS).toBe(true);
    expect(senseConfig.foreignKeys.map((foreignKey) => foreignKey.onDelete)).toContain('cascade');
    expect(
      categoryConfig.foreignKeys.every((foreignKey) => foreignKey.onDelete === 'cascade'),
    ).toBe(true);
    expect(
      progressConfig.foreignKeys.every((foreignKey) => foreignKey.onDelete === 'cascade'),
    ).toBe(true);
    expect(senseConfig.policies.map((policy) => policy.name)).toEqual(
      expect.arrayContaining([
        'Admins can manage word senses',
        'Public can view published word senses',
      ]),
    );
  });
});
