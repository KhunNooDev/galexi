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
  resolvePracticeAnswer,
  validateLessonActivities,
} from '@/features/learning/lessons/lesson-activities';

const words = [
  { id: 8, meaningsTh: ['อยากรู้อยากเห็น'], word: 'curious' },
  { id: 9, meaningsTh: ['ปรับปรุง'], word: 'improve' },
  { id: 10, meaningsTh: ['โอกาส'], word: 'opportunity' },
  { id: 7, meaningsTh: ['ทำสำเร็จ'], word: 'accomplish' },
  { id: 11, meaningsTh: ['เชื่อถือได้'], word: 'reliable' },
  { id: 16, meaningsTh: ['จำเป็น'], word: 'essential' },
] as const;

describe('Lesson 1 activities', () => {
  it('builds six deterministic and valid practice questions', () => {
    const firstBuild = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);
    const secondBuild = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);

    expect(firstBuild).toEqual(secondBuild);
    expect(firstBuild).toHaveLength(6);
    expect(new Set(firstBuild.map((question) => question.id)).size).toBe(6);
    expect(firstBuild.every((question) => question.options.length === 4)).toBe(true);
    expect(() =>
      validateLessonActivities(words, firstBuild, FIRST_LESSON_CONVERSATION),
    ).not.toThrow();
  });

  it('resolves correctness only from the authoritative question', () => {
    const [question] = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);

    expect(resolvePracticeAnswer(question, question.correctOptionId).isCorrect).toBe(true);
    expect(
      resolvePracticeAnswer(
        question,
        question.options.find((option) => option.id !== question.correctOptionId)!.id,
      ).isCorrect,
    ).toBe(false);
    expect(() => resolvePracticeAnswer(question, 'fake-option')).toThrow();
  });

  it('keeps duplicate practice submissions idempotent', () => {
    const [question] = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);
    const state = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.PRACTICE,
    };
    const first = addPracticeAnswer(state, question, question.correctOptionId, words.length);
    const duplicate = addPracticeAnswer(
      first.state,
      question,
      question.correctOptionId,
      words.length,
    );

    expect(first.isDuplicate).toBe(false);
    expect(duplicate.isDuplicate).toBe(true);
    expect(duplicate.state.practice.answers).toHaveLength(1);
  });

  it('rejects a different answer for an already answered practice question', () => {
    const [question] = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);
    const state = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.PRACTICE,
    };
    const first = addPracticeAnswer(state, question, question.correctOptionId, words.length);
    const differentOption = question.options.find(
      (option) => option.id !== question.correctOptionId,
    )!;

    expect(() =>
      addPracticeAnswer(first.state, question, differentOption.id, words.length),
    ).toThrow('already been answered');
  });

  it('moves from Practice to Conversation after the final answer', () => {
    const questions = buildPracticeQuestions(words, FIRST_LESSON_CONVERSATION);
    let state: LessonSessionState = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.PRACTICE,
    };

    for (const question of questions) {
      state = addPracticeAnswer(state, question, question.correctOptionId, questions.length).state;
    }

    expect(state.phase).toBe(LESSON_PHASE.CONVERSATION);
    expect(state.practice.answers).toHaveLength(questions.length);
  });

  it('persists stable conversation responses and hands off to Result', () => {
    let state: LessonSessionState = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.CONVERSATION,
    };

    for (const turn of FIRST_LESSON_CONVERSATION) {
      state = addConversationResponse(
        state,
        turn,
        turn.responses[0].id,
        FIRST_LESSON_CONVERSATION.length,
      ).state;
    }

    expect(state.phase).toBe(LESSON_PHASE.RESULT);
    expect(state.conversation.responses).toEqual(
      FIRST_LESSON_CONVERSATION.map((turn) => ({
        responseId: turn.responses[0].id,
        turnId: turn.id,
      })),
    );
  });

  it('keeps duplicate conversation submissions idempotent', () => {
    const turn = FIRST_LESSON_CONVERSATION[0];
    const state = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.CONVERSATION,
    };
    const first = addConversationResponse(
      state,
      turn,
      turn.responses[0].id,
      FIRST_LESSON_CONVERSATION.length,
    );
    const duplicate = addConversationResponse(
      first.state,
      turn,
      turn.responses[0].id,
      FIRST_LESSON_CONVERSATION.length,
    );

    expect(first.isDuplicate).toBe(false);
    expect(duplicate.isDuplicate).toBe(true);
    expect(duplicate.state.conversation.responses).toHaveLength(1);
  });

  it('rejects an invalid conversation response reference', () => {
    const turn = FIRST_LESSON_CONVERSATION[0];
    const state = {
      ...createInitialLessonState(),
      phase: LESSON_PHASE.CONVERSATION,
    };

    expect(() =>
      addConversationResponse(state, turn, 'missing-response', FIRST_LESSON_CONVERSATION.length),
    ).toThrow('invalid');
  });
});
