import {
  LESSON_PHASE,
  type LessonResultSnapshot,
  type LessonSessionState,
} from '@/features/learning/lesson.schema';
import {
  type ActivityWord,
  type ConversationTurn,
  type PracticeQuestion,
  resolvePracticeAnswer,
} from '@/features/learning/lessons/lesson-activities';

export const MASTERY_LABEL = {
  DEVELOPING: 'developing',
  FAMILIAR: 'familiar',
  NEW: 'new',
  PRACTICING: 'practicing',
  STRONG: 'strong',
} as const;

type MasteryLabel = (typeof MASTERY_LABEL)[keyof typeof MASTERY_LABEL];

type CreateLessonResultSnapshotInput = {
  completedAt: Date;
  conversation: readonly ConversationTurn[];
  masteryByWordSenseId: ReadonlyMap<number, number>;
  questions: readonly PracticeQuestion[];
  state: LessonSessionState;
  words: readonly ActivityWord[];
};

export function calculateAccuracy(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function getMasteryLabel(mastery: number): MasteryLabel {
  if (mastery >= 75) return MASTERY_LABEL.STRONG;
  if (mastery >= 50) return MASTERY_LABEL.FAMILIAR;
  if (mastery >= 25) return MASTERY_LABEL.DEVELOPING;
  if (mastery > 0) return MASTERY_LABEL.PRACTICING;
  return MASTERY_LABEL.NEW;
}

export function createLessonResultSnapshot({
  completedAt,
  conversation,
  masteryByWordSenseId,
  questions,
  state,
  words,
}: CreateLessonResultSnapshotInput): LessonResultSnapshot {
  if (state.phase !== LESSON_PHASE.RESULT) {
    throw new Error('Lesson result is not available');
  }

  const answersByQuestion = new Map(
    state.practice.answers.map((answer) => [answer.questionId, answer]),
  );
  const correct = questions.reduce((count, question) => {
    const answer = answersByQuestion.get(question.id);

    if (!answer || answer.wordSenseId !== question.targetWordSenseId) {
      throw new Error('Practice result is incomplete');
    }

    return count + Number(resolvePracticeAnswer(question, answer.selectedOptionId).isCorrect);
  }, 0);

  if (answersByQuestion.size !== questions.length) {
    throw new Error('Practice result is incomplete');
  }

  const responsesByTurn = new Map(
    state.conversation.responses.map((response) => [response.turnId, response]),
  );

  for (const turn of conversation) {
    const response = responsesByTurn.get(turn.id);

    if (!response || !turn.responses.some((candidate) => candidate.id === response.responseId)) {
      throw new Error('Conversation result is incomplete');
    }
  }

  if (responsesByTurn.size !== conversation.length) {
    throw new Error('Conversation result is incomplete');
  }

  return {
    accuracy: calculateAccuracy(correct, questions.length),
    completedAt: completedAt.toISOString(),
    conversationTurns: conversation.length,
    mastery: words.map((word) => ({
      meaning: word.meaningsTh[0] ?? '',
      value: masteryByWordSenseId.get(word.id) ?? 0,
      word: word.word,
      wordSenseId: word.id,
    })),
    practiceCorrect: correct,
    practiceTotal: questions.length,
  };
}

export function getStableLessonResultSnapshot(
  existingSnapshot: LessonResultSnapshot | undefined,
  input: CreateLessonResultSnapshotInput,
) {
  return existingSnapshot ?? createLessonResultSnapshot(input);
}
