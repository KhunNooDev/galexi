import { describe, expect, it } from 'vitest';

import {
  createInitialLessonState,
  LESSON_PHASE,
  type LessonSessionState,
} from '@/features/learning/lesson.schema';
import {
  addConversationResponse,
  addPracticeAnswer,
  buildPracticeQuestions,
  FIRST_LESSON_CONVERSATION,
} from '@/features/learning/lessons/lesson-activities';
import {
  calculateAccuracy,
  createLessonResultSnapshot,
  getMasteryLabel,
  getStableLessonResultSnapshot,
  MASTERY_LABEL,
} from '@/features/learning/lessons/lesson-result';

const words = [
  { id: 8, meaningsTh: ['อยากรู้อยากเห็น'], word: 'curious' },
  { id: 9, meaningsTh: ['ปรับปรุง'], word: 'improve' },
  { id: 10, meaningsTh: ['โอกาส'], word: 'opportunity' },
  { id: 7, meaningsTh: ['ทำสำเร็จ'], word: 'accomplish' },
  { id: 11, meaningsTh: ['เชื่อถือได้'], word: 'reliable' },
  { id: 16, meaningsTh: ['จำเป็น'], word: 'essential' },
] as const;

function createCompleteState() {
  const questions = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);
  let state: LessonSessionState = {
    ...createInitialLessonState(),
    phase: LESSON_PHASE.PRACTICE,
  };

  for (const [index, question] of questions.entries()) {
    const selectedOptionId =
      index === 0
        ? question.options.find((option) => option.id !== question.correctOptionId)!.id
        : question.correctOptionId;
    state = addPracticeAnswer(state, question, selectedOptionId, questions.length).state;
  }

  for (const turn of FIRST_LESSON_CONVERSATION) {
    state = addConversationResponse(
      state,
      turn,
      turn.responses[0].id,
      FIRST_LESSON_CONVERSATION.length,
    ).state;
  }

  return { questions, state };
}

describe('lesson result', () => {
  it('aggregates authoritative practice and conversation results', () => {
    const { questions, state } = createCompleteState();
    const snapshot = createLessonResultSnapshot({
      completedAt: new Date('2026-08-13T03:00:00.000Z'),
      conversation: FIRST_LESSON_CONVERSATION,
      masteryByWordId: new Map([[8, 25]]),
      questions,
      state,
      words,
    });

    expect(snapshot).toMatchObject({
      accuracy: 83,
      conversationTurns: 3,
      practiceCorrect: 5,
      practiceTotal: 6,
    });
    expect(snapshot.mastery[0]).toEqual({
      meaning: 'อยากรู้อยากเห็น',
      value: 25,
      word: 'curious',
      wordId: 8,
    });
    expect(snapshot.mastery[1]).toMatchObject({ value: 0, wordId: 9 });
  });

  it('keeps a completed snapshot stable and idempotent', () => {
    const { questions, state } = createCompleteState();
    const input = {
      completedAt: new Date('2026-08-13T03:00:00.000Z'),
      conversation: FIRST_LESSON_CONVERSATION,
      masteryByWordId: new Map([[8, 10]]),
      questions,
      state,
      words,
    };
    const first = getStableLessonResultSnapshot(undefined, input);
    const repeated = getStableLessonResultSnapshot(first, {
      ...input,
      completedAt: new Date('2026-08-14T03:00:00.000Z'),
      masteryByWordId: new Map([[8, 90]]),
    });

    expect(repeated).toBe(first);
    expect(repeated.completedAt).toBe('2026-08-13T03:00:00.000Z');
    expect(repeated.mastery[0].value).toBe(10);
  });

  it('handles zero totals and maps mastery to simple labels', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
    expect(getMasteryLabel(0)).toBe(MASTERY_LABEL.NEW);
    expect(getMasteryLabel(10)).toBe(MASTERY_LABEL.PRACTICING);
    expect(getMasteryLabel(25)).toBe(MASTERY_LABEL.DEVELOPING);
    expect(getMasteryLabel(50)).toBe(MASTERY_LABEL.FAMILIAR);
    expect(getMasteryLabel(75)).toBe(MASTERY_LABEL.STRONG);
  });
});
