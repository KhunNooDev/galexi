import 'server-only';

import { and, eq } from 'drizzle-orm';

import { IDENTITY_KIND } from '@/constants/identity';
import { getDatabase } from '@/db';
import { userWordProgress, words } from '@/db/schema';
import { wordProgressInputSchema } from '@/features/learning/learning.schema';
import { requireLearningIdentity } from '@/features/learning/server/learning-identity';

const wordProgressColumns = {
  correctCount: userWordProgress.correctCount,
  incorrectCount: userWordProgress.incorrectCount,
  lastSeenAt: userWordProgress.lastSeenAt,
  mastery: userWordProgress.mastery,
  seenCount: userWordProgress.seenCount,
  updatedAt: userWordProgress.updatedAt,
  wordId: userWordProgress.wordId,
};

export async function getCurrentUserWordProgress(wordId: number) {
  const { kind, userId } = await requireLearningIdentity();
  const parsedWordId = wordProgressInputSchema.shape.wordId.parse(wordId);
  const [progress] = await getDatabase()
    .select(wordProgressColumns)
    .from(userWordProgress)
    .innerJoin(words, eq(words.id, userWordProgress.wordId))
    .where(
      and(
        eq(userWordProgress.userId, userId),
        eq(userWordProgress.wordId, parsedWordId),
        kind === IDENTITY_KIND.ADMIN ? undefined : eq(words.isPublic, true),
      ),
    )
    .limit(1);

  return progress ?? null;
}

export async function upsertCurrentUserWordProgress(input: unknown) {
  const { kind, userId } = await requireLearningIdentity();
  const values = wordProgressInputSchema.parse(input);
  const database = getDatabase();
  const [visibleWord] = await database
    .select({ id: words.id })
    .from(words)
    .where(
      and(
        eq(words.id, values.wordId),
        kind === IDENTITY_KIND.ADMIN ? undefined : eq(words.isPublic, true),
      ),
    )
    .limit(1);

  if (!visibleWord) {
    throw new Error('Word is not available for learning');
  }

  const [progress] = await database
    .insert(userWordProgress)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: [userWordProgress.userId, userWordProgress.wordId],
      set: {
        correctCount: values.correctCount,
        incorrectCount: values.incorrectCount,
        lastSeenAt: values.lastSeenAt,
        mastery: values.mastery,
        seenCount: values.seenCount,
        updatedAt: new Date(),
      },
    })
    .returning(wordProgressColumns);

  if (!progress) {
    throw new Error('Unable to update word progress');
  }

  return progress;
}
