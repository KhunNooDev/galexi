import {
  LEARNING_GOAL,
  LEARNING_LEVEL,
  LEARNING_LIMITS,
  LEARNING_SESSION_STATUS,
} from '@/features/learning/learning.constants';
import { LESSON_PHASE, lessonSessionStateSchema } from '@/features/learning/lesson.schema';

const POSTGRES_INTEGER_MAX = 2_147_483_647;

type NullableDate = Date | null;

type LearningProfileMergeValue = {
  goal: (typeof LEARNING_GOAL)[keyof typeof LEARNING_GOAL] | null;
  level: (typeof LEARNING_LEVEL)[keyof typeof LEARNING_LEVEL] | null;
  onboardingCompletedAt: NullableDate;
};

type LearningSessionMergeValue = {
  id: string;
  startedAt: Date;
  state: unknown;
  status: string;
  updatedAt: Date;
};

type WordProgressMergeValue = {
  correctCount: number;
  incorrectCount: number;
  lastSeenAt: NullableDate;
  mastery: number;
  seenCount: number;
};

const phaseRank = {
  [LESSON_PHASE.LEARN]: 1,
  [LESSON_PHASE.PRACTICE]: 2,
  [LESSON_PHASE.CONVERSATION]: 3,
  [LESSON_PHASE.RESULT]: 4,
} as const;

function latestDate(first: NullableDate, second: NullableDate) {
  if (!first) return second;
  if (!second) return first;
  return first >= second ? first : second;
}

function addCounters(first: number, second: number) {
  return Math.min(POSTGRES_INTEGER_MAX, Math.max(0, first) + Math.max(0, second));
}

export function mergeLearningProfiles(
  source: LearningProfileMergeValue | null,
  destination: LearningProfileMergeValue | null,
): LearningProfileMergeValue | null {
  if (!source && !destination) return null;

  const goal = destination?.goal ?? source?.goal ?? null;
  const level = destination?.level ?? source?.level ?? null;
  const completedAt = destination?.onboardingCompletedAt ?? source?.onboardingCompletedAt ?? null;

  return {
    goal,
    level,
    onboardingCompletedAt: goal && level ? completedAt : null,
  };
}

function getLearningSessionProgressRank(session: LearningSessionMergeValue) {
  if (session.status === LEARNING_SESSION_STATUS.COMPLETED) return 5;
  if (session.status !== LEARNING_SESSION_STATUS.IN_PROGRESS) return 0;

  const state = lessonSessionStateSchema.safeParse(session.state);
  return state.success ? phaseRank[state.data.phase] : 0;
}

export function selectPreferredInProgressSession(sessions: readonly LearningSessionMergeValue[]) {
  return [...sessions].sort((first, second) => {
    const rankDifference =
      getLearningSessionProgressRank(second) - getLearningSessionProgressRank(first);
    if (rankDifference !== 0) return rankDifference;

    const updatedDifference = second.updatedAt.getTime() - first.updatedAt.getTime();
    if (updatedDifference !== 0) return updatedDifference;

    const startedDifference = second.startedAt.getTime() - first.startedAt.getTime();
    if (startedDifference !== 0) return startedDifference;

    return first.id.localeCompare(second.id);
  })[0];
}

export function mergeWordProgress(
  source: WordProgressMergeValue,
  destination: WordProgressMergeValue,
): WordProgressMergeValue {
  return {
    correctCount: addCounters(source.correctCount, destination.correctCount),
    incorrectCount: addCounters(source.incorrectCount, destination.incorrectCount),
    lastSeenAt: latestDate(source.lastSeenAt, destination.lastSeenAt),
    // Prompt 5 mastery is incremental and order-dependent, so it cannot be
    // reconstructed from aggregate counters. Keep the strongest valid state.
    mastery: Math.min(
      LEARNING_LIMITS.MASTERY_MAX,
      Math.max(0, source.mastery, destination.mastery),
    ),
    seenCount: addCounters(source.seenCount, destination.seenCount),
  };
}
