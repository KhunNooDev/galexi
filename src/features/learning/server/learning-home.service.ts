import 'server-only';

import { resolveLearningContinuation } from '@/features/learning/learning-continuation';
import { normalizeLessonSessionState } from '@/features/learning/lesson.schema';
import { getLessonDefinition } from '@/features/learning/lessons/lesson-catalog';
import { loadLearningHomeState } from '@/features/learning/server/learning-home.persistence';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';
import { getOrCreateCurrentLearningProfile } from '@/features/learning/server/learning-profile.service';

export async function getCurrentLearningHome() {
  const [{ userId }, profile] = await Promise.all([
    requireLearningIdentity(),
    getOrCreateCurrentLearningProfile(),
  ]);
  const homeState = await loadLearningHomeState(userId);
  const { inProgressSession, recentSession } = homeState;
  const inProgressLesson = inProgressSession
    ? getLessonDefinition(inProgressSession.lessonKey)
    : null;
  const inProgressState =
    inProgressSession && inProgressLesson
      ? normalizeLessonSessionState(inProgressSession.state, inProgressLesson.wordSenseIds)
      : null;
  const continuation = resolveLearningContinuation({
    completedLessonKey: recentSession?.lessonKey,
    goal: profile.goal,
    inProgress:
      inProgressSession && inProgressState
        ? {
            currentStep: inProgressSession.currentStep,
            lessonKey: inProgressSession.lessonKey,
            phase: inProgressState.phase,
            sessionId: inProgressSession.id,
          }
        : undefined,
    level: profile.level,
    onboardingCompletedAt: profile.onboardingCompletedAt,
  });

  return {
    completedLessonCount: homeState.completedLessonCount,
    continuation,
    recentLesson: recentSession
      ? {
          lessonKey: recentSession.lessonKey,
          score: recentSession.score ?? 0,
          sessionId: recentSession.id,
        }
      : null,
    wordsPracticed: homeState.wordsPracticed,
  };
}
