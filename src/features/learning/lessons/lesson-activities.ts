import { LESSON_PHASE, type LessonSessionState } from '@/features/learning/lesson.schema';

const PRACTICE_OPTION_COUNT = 4;

export const MASTERY_CHANGE = {
  CORRECT: 10,
  INCORRECT: -5,
} as const;

export type ActivityWord = {
  id: number;
  meaningsTh: readonly string[];
  word: string;
};

export type PracticeOption = {
  id: string;
  label: string;
  language: 'en' | 'th';
};

export type PracticeQuestion = {
  correctOptionId: string;
  id: string;
  kind: 'meaning-to-word' | 'word-to-meaning';
  options: PracticeOption[];
  promptValue: string;
  targetWordId: number;
  targetWordMeaning: string;
  targetWordText: string;
};

export type PracticeQuestionView = Omit<
  PracticeQuestion,
  'correctOptionId' | 'targetWordId' | 'targetWordMeaning' | 'targetWordText'
>;

export type ConversationMessageKey =
  | 'content.turns.momentumPlan.message'
  | 'content.turns.momentumPlan.responses.improveEnglish'
  | 'content.turns.momentumPlan.responses.curiousNext'
  | 'content.turns.momentumPlan.responses.opportunityLearn'
  | 'content.turns.momentumMethod.message'
  | 'content.turns.momentumMethod.responses.reliablePractice'
  | 'content.turns.momentumMethod.responses.accomplishGoal'
  | 'content.turns.momentumMethod.responses.improveDaily'
  | 'content.turns.momentumReady.message'
  | 'content.turns.momentumReady.responses.curiousReady'
  | 'content.turns.momentumReady.responses.opportunityImportant'
  | 'content.turns.momentumReady.responses.accomplishStep';

export type ConversationResponse = {
  id: string;
  messageKey: ConversationMessageKey;
  wordIds: readonly number[];
};

export type ConversationTurn = {
  id: string;
  messageKey: ConversationMessageKey;
  responses: readonly ConversationResponse[];
};

export const FIRST_LESSON_CONVERSATION = [
  {
    id: 'momentum-plan',
    messageKey: 'content.turns.momentumPlan.message',
    responses: [
      {
        id: 'improve-english',
        messageKey: 'content.turns.momentumPlan.responses.improveEnglish',
        wordIds: [9],
      },
      {
        id: 'curious-next',
        messageKey: 'content.turns.momentumPlan.responses.curiousNext',
        wordIds: [8],
      },
      {
        id: 'opportunity-learn',
        messageKey: 'content.turns.momentumPlan.responses.opportunityLearn',
        wordIds: [10],
      },
    ],
  },
  {
    id: 'momentum-method',
    messageKey: 'content.turns.momentumMethod.message',
    responses: [
      {
        id: 'reliable-practice',
        messageKey: 'content.turns.momentumMethod.responses.reliablePractice',
        wordIds: [11, 16],
      },
      {
        id: 'accomplish-goal',
        messageKey: 'content.turns.momentumMethod.responses.accomplishGoal',
        wordIds: [7],
      },
      {
        id: 'improve-daily',
        messageKey: 'content.turns.momentumMethod.responses.improveDaily',
        wordIds: [9],
      },
    ],
  },
  {
    id: 'momentum-ready',
    messageKey: 'content.turns.momentumReady.message',
    responses: [
      {
        id: 'curious-ready',
        messageKey: 'content.turns.momentumReady.responses.curiousReady',
        wordIds: [8],
      },
      {
        id: 'opportunity-important',
        messageKey: 'content.turns.momentumReady.responses.opportunityImportant',
        wordIds: [10, 16],
      },
      {
        id: 'accomplish-step',
        messageKey: 'content.turns.momentumReady.responses.accomplishStep',
        wordIds: [7],
      },
    ],
  },
] as const satisfies readonly ConversationTurn[];

function getPracticeCandidates(words: readonly ActivityWord[], targetIndex: number) {
  const target = words[targetIndex];
  const distractors = Array.from({ length: PRACTICE_OPTION_COUNT - 1 }, (_, offset) => {
    return words[(targetIndex + offset + 1) % words.length];
  });
  const correctPosition = (targetIndex * 3 + 1) % PRACTICE_OPTION_COUNT;
  const candidates = [...distractors];

  candidates.splice(correctPosition, 0, target);
  return candidates;
}

export function buildPracticeQuestions(
  words: readonly ActivityWord[],
  conversation: readonly ConversationTurn[],
): PracticeQuestion[] {
  if (words.length < PRACTICE_OPTION_COUNT) {
    throw new Error('Practice requires at least four lesson words');
  }

  const questions = words.map((target, index) => {
    const kind: PracticeQuestion['kind'] = index % 2 === 0 ? 'meaning-to-word' : 'word-to-meaning';
    const questionId = `practice-${index + 1}-word-${target.id}`;
    const options = getPracticeCandidates(words, index).map((candidate) => ({
      id: `${questionId}:word-${candidate.id}`,
      label: kind === 'meaning-to-word' ? candidate.word : candidate.meaningsTh[0],
      language: kind === 'meaning-to-word' ? ('en' as const) : ('th' as const),
    }));

    return {
      correctOptionId: `${questionId}:word-${target.id}`,
      id: questionId,
      kind,
      options,
      promptValue: kind === 'meaning-to-word' ? target.meaningsTh[0] : target.word,
      targetWordId: target.id,
      targetWordMeaning: target.meaningsTh[0],
      targetWordText: target.word,
    };
  });

  validateLessonActivities(words, questions, conversation);
  return questions;
}

export function toPracticeQuestionView(question: PracticeQuestion): PracticeQuestionView {
  return {
    id: question.id,
    kind: question.kind,
    options: question.options,
    promptValue: question.promptValue,
  };
}

export function resolvePracticeAnswer(question: PracticeQuestion, selectedOptionId: string) {
  if (!question.options.some((option) => option.id === selectedOptionId)) {
    throw new Error('The selected practice option is invalid');
  }

  return {
    isCorrect: selectedOptionId === question.correctOptionId,
    wordId: question.targetWordId,
  };
}

export function addPracticeAnswer(
  state: LessonSessionState,
  question: PracticeQuestion,
  selectedOptionId: string,
  questionCount: number,
) {
  const existingAnswer = state.practice.answers.find((answer) => answer.questionId === question.id);

  if (existingAnswer) {
    if (existingAnswer.selectedOptionId !== selectedOptionId) {
      throw new Error('The practice question has already been answered');
    }

    return { answer: existingAnswer, isDuplicate: true as const, state };
  }

  const resolved = resolvePracticeAnswer(question, selectedOptionId);
  const answer = {
    isCorrect: resolved.isCorrect,
    questionId: question.id,
    selectedOptionId,
    wordId: resolved.wordId,
  };
  const answers = [...state.practice.answers, answer];
  const nextState: LessonSessionState = {
    ...state,
    phase: answers.length >= questionCount ? LESSON_PHASE.CONVERSATION : LESSON_PHASE.PRACTICE,
    practice: { answers },
  };

  return { answer, isDuplicate: false as const, state: nextState };
}

export function addConversationResponse(
  state: LessonSessionState,
  turn: ConversationTurn,
  responseId: string,
  turnCount: number,
) {
  const existingResponse = state.conversation.responses.find(
    (response) => response.turnId === turn.id,
  );

  if (existingResponse) {
    if (existingResponse.responseId !== responseId) {
      throw new Error('The conversation turn has already been answered');
    }

    return { isDuplicate: true as const, response: existingResponse, state };
  }

  const response = turn.responses.find((candidate) => candidate.id === responseId);

  if (!response) {
    throw new Error('The selected conversation response is invalid');
  }

  const responses = [...state.conversation.responses, { responseId, turnId: turn.id }];
  const nextState: LessonSessionState = {
    ...state,
    conversation: { responses },
    phase: responses.length >= turnCount ? LESSON_PHASE.RESULT : LESSON_PHASE.CONVERSATION,
  };

  return { isDuplicate: false as const, response, state: nextState };
}

export function validateLessonActivities(
  words: readonly ActivityWord[],
  questions: readonly PracticeQuestion[],
  conversation: readonly ConversationTurn[],
) {
  const lessonWordIds = new Set(words.map((word) => word.id));
  const questionIds = new Set<string>();
  const turnIds = new Set<string>();

  for (const word of words) {
    if (!word.word.trim() || !word.meaningsTh[0]?.trim()) {
      throw new Error('Every practice word requires English and Thai content');
    }
  }

  for (const question of questions) {
    if (questionIds.has(question.id) || !lessonWordIds.has(question.targetWordId)) {
      throw new Error('Practice question definition is invalid');
    }

    questionIds.add(question.id);
    const optionIds = new Set(question.options.map((option) => option.id));

    if (
      question.options.length !== PRACTICE_OPTION_COUNT ||
      optionIds.size !== PRACTICE_OPTION_COUNT ||
      !optionIds.has(question.correctOptionId)
    ) {
      throw new Error('Practice question options are invalid');
    }
  }

  for (const turn of conversation) {
    if (turnIds.has(turn.id) || turn.responses.length === 0) {
      throw new Error('Conversation turn definition is invalid');
    }

    turnIds.add(turn.id);
    const responseIds = new Set<string>();

    for (const response of turn.responses) {
      if (
        responseIds.has(response.id) ||
        response.wordIds.length === 0 ||
        response.wordIds.some((wordId) => !lessonWordIds.has(wordId))
      ) {
        throw new Error('Conversation response definition is invalid');
      }

      responseIds.add(response.id);
    }
  }
}
