import 'server-only';

import { and, eq, inArray, lt, or } from 'drizzle-orm';

import type { AppIdentity, PermanentIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { getDatabase } from '@/db';
import {
  learningAccountTransfers,
  learningProfiles,
  learningSessions,
  userWordProgress,
} from '@/db/schema';
import {
  LEARNING_ACCOUNT_TRANSFER,
  LEARNING_ACCOUNT_TRANSFER_STATUS,
} from '@/features/learning/account/account.constants';
import {
  createLearningTransferToken,
  hashLearningTransferToken,
} from '@/features/learning/account/account-transfer-token';
import {
  mergeLearningProfiles,
  mergeWordProgress,
  selectPreferredInProgressSession,
} from '@/features/learning/account/merge-learning-data';
import { LEARNING_SESSION_STATUS } from '@/features/learning/learning.constants';

type LearningAccountTransferResult =
  | { status: 'already-consumed' }
  | { status: 'consumed' }
  | { status: 'expired' }
  | { status: 'invalid' };

type LearningAccountTransferPreparationResult =
  { expiresAt: Date; status: 'prepared' } | { status: 'expired' } | { status: 'invalid' };

function getTransferExpiry(now: Date) {
  return new Date(now.getTime() + LEARNING_ACCOUNT_TRANSFER.TOKEN_TTL_MINUTES * 60 * 1000);
}

export async function createLearningAccountTransfer(identity: AppIdentity) {
  if (identity.kind !== IDENTITY_KIND.GUEST) {
    throw new Error('Only a Guest can create a learning account transfer');
  }

  const token = createLearningTransferToken();
  const tokenHash = hashLearningTransferToken(token);
  const now = new Date();
  const expiresAt = getTransferExpiry(now);
  const retentionCutoff = new Date(
    now.getTime() - LEARNING_ACCOUNT_TRANSFER.RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  await getDatabase().transaction(async (transaction) => {
    await transaction
      .update(learningAccountTransfers)
      .set({ status: LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED })
      .where(
        and(
          eq(learningAccountTransfers.status, LEARNING_ACCOUNT_TRANSFER_STATUS.PENDING),
          lt(learningAccountTransfers.expiresAt, now),
        ),
      );

    await transaction
      .update(learningAccountTransfers)
      .set({ status: LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED })
      .where(
        and(
          eq(learningAccountTransfers.sourceUserId, identity.userId),
          eq(learningAccountTransfers.status, LEARNING_ACCOUNT_TRANSFER_STATUS.PENDING),
        ),
      );

    await transaction
      .delete(learningAccountTransfers)
      .where(
        and(
          lt(learningAccountTransfers.createdAt, retentionCutoff),
          inArray(learningAccountTransfers.status, [
            LEARNING_ACCOUNT_TRANSFER_STATUS.CONSUMED,
            LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED,
          ]),
        ),
      );

    await transaction.insert(learningAccountTransfers).values({
      expiresAt,
      sourceUserId: identity.userId,
      tokenHash,
    });
  });

  return { expiresAt, token };
}

export async function prepareLearningAccountTransfer(
  token: string,
  sourceUserId: string,
): Promise<LearningAccountTransferPreparationResult> {
  if (!token || token.length > 256) return { status: 'invalid' };

  const tokenHash = hashLearningTransferToken(token);
  const now = new Date();

  return getDatabase().transaction(async (transaction) => {
    const [transfer] = await transaction
      .select()
      .from(learningAccountTransfers)
      .where(eq(learningAccountTransfers.tokenHash, tokenHash))
      .limit(1)
      .for('update');

    if (!transfer || transfer.sourceUserId !== sourceUserId) return { status: 'invalid' };

    if (transfer.status !== LEARNING_ACCOUNT_TRANSFER_STATUS.PENDING) {
      return { status: 'invalid' };
    }

    if (transfer.expiresAt <= now) {
      await transaction
        .update(learningAccountTransfers)
        .set({ status: LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED })
        .where(eq(learningAccountTransfers.id, transfer.id));
      return { status: 'expired' };
    }

    const expiresAt = getTransferExpiry(now);
    await transaction
      .update(learningAccountTransfers)
      .set({ expiresAt })
      .where(eq(learningAccountTransfers.id, transfer.id));

    return { expiresAt, status: 'prepared' };
  });
}

export async function completeSameUserAccountTransfer(
  token: string,
  userId: string,
): Promise<LearningAccountTransferResult> {
  if (!token || token.length > 256) return { status: 'invalid' };

  const tokenHash = hashLearningTransferToken(token);
  const now = new Date();

  return getDatabase().transaction(async (transaction) => {
    const [transfer] = await transaction
      .select()
      .from(learningAccountTransfers)
      .where(eq(learningAccountTransfers.tokenHash, tokenHash))
      .limit(1)
      .for('update');

    if (!transfer || transfer.sourceUserId !== userId) return { status: 'invalid' };

    if (transfer.status === LEARNING_ACCOUNT_TRANSFER_STATUS.CONSUMED) {
      return transfer.destinationUserId === userId
        ? { status: 'already-consumed' }
        : { status: 'invalid' };
    }

    if (transfer.status === LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED || transfer.expiresAt <= now) {
      if (transfer.status !== LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED) {
        await transaction
          .update(learningAccountTransfers)
          .set({ status: LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED })
          .where(eq(learningAccountTransfers.id, transfer.id));
      }

      return { status: 'expired' };
    }

    await transaction
      .update(learningAccountTransfers)
      .set({
        consumedAt: now,
        destinationUserId: userId,
        status: LEARNING_ACCOUNT_TRANSFER_STATUS.CONSUMED,
      })
      .where(eq(learningAccountTransfers.id, transfer.id));

    return { status: 'consumed' };
  });
}

export async function consumeLearningAccountTransfer(
  token: string,
  destination: PermanentIdentity,
): Promise<LearningAccountTransferResult> {
  if (!token || token.length > 256) return { status: 'invalid' };

  const tokenHash = hashLearningTransferToken(token);
  const now = new Date();

  return getDatabase().transaction(async (transaction) => {
    const [transfer] = await transaction
      .select()
      .from(learningAccountTransfers)
      .where(eq(learningAccountTransfers.tokenHash, tokenHash))
      .limit(1)
      .for('update');

    if (!transfer) return { status: 'invalid' };

    if (transfer.status === LEARNING_ACCOUNT_TRANSFER_STATUS.CONSUMED) {
      return transfer.destinationUserId === destination.userId
        ? { status: 'already-consumed' }
        : { status: 'invalid' };
    }

    if (transfer.status === LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED || transfer.expiresAt <= now) {
      if (transfer.status !== LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED) {
        await transaction
          .update(learningAccountTransfers)
          .set({ status: LEARNING_ACCOUNT_TRANSFER_STATUS.EXPIRED })
          .where(eq(learningAccountTransfers.id, transfer.id));
      }

      return { status: 'expired' };
    }

    if (transfer.sourceUserId === destination.userId) return { status: 'invalid' };

    await mergeLearningProfilesForTransfer(transaction, transfer.sourceUserId, destination.userId);
    await mergeLearningSessionsForTransfer(transaction, transfer.sourceUserId, destination.userId);
    await mergeWordProgressForTransfer(transaction, transfer.sourceUserId, destination.userId);

    await transaction
      .update(learningAccountTransfers)
      .set({
        consumedAt: now,
        destinationUserId: destination.userId,
        status: LEARNING_ACCOUNT_TRANSFER_STATUS.CONSUMED,
      })
      .where(
        and(
          eq(learningAccountTransfers.id, transfer.id),
          eq(learningAccountTransfers.status, LEARNING_ACCOUNT_TRANSFER_STATUS.PENDING),
        ),
      );

    return { status: 'consumed' };
  });
}

type LearningTransaction = Parameters<
  Parameters<ReturnType<typeof getDatabase>['transaction']>[0]
>[0];

async function mergeLearningProfilesForTransfer(
  transaction: LearningTransaction,
  sourceUserId: string,
  destinationUserId: string,
) {
  const rows = await transaction
    .select()
    .from(learningProfiles)
    .where(
      or(eq(learningProfiles.userId, sourceUserId), eq(learningProfiles.userId, destinationUserId)),
    )
    .for('update');
  const source = rows.find((profile) => profile.userId === sourceUserId) ?? null;
  const destination = rows.find((profile) => profile.userId === destinationUserId) ?? null;
  const merged = mergeLearningProfiles(source, destination);

  if (merged) {
    await transaction
      .insert(learningProfiles)
      .values({ ...merged, userId: destinationUserId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: learningProfiles.userId,
        set: { ...merged, updatedAt: new Date() },
      });
  }

  if (source) {
    await transaction.delete(learningProfiles).where(eq(learningProfiles.userId, sourceUserId));
  }
}

async function mergeLearningSessionsForTransfer(
  transaction: LearningTransaction,
  sourceUserId: string,
  destinationUserId: string,
) {
  const sessions = await transaction
    .select()
    .from(learningSessions)
    .where(
      or(eq(learningSessions.userId, sourceUserId), eq(learningSessions.userId, destinationUserId)),
    )
    .for('update');
  const activeByLesson = new Map<string, typeof sessions>();

  for (const session of sessions) {
    if (session.status !== LEARNING_SESSION_STATUS.IN_PROGRESS) continue;
    activeByLesson.set(session.lessonKey, [
      ...(activeByLesson.get(session.lessonKey) ?? []),
      session,
    ]);
  }

  const abandonedIds: string[] = [];

  for (const activeSessions of activeByLesson.values()) {
    if (activeSessions.length < 2) continue;
    const preferred = selectPreferredInProgressSession(activeSessions);
    abandonedIds.push(
      ...activeSessions
        .filter((session) => session.id !== preferred?.id)
        .map((session) => session.id),
    );
  }

  if (abandonedIds.length > 0) {
    await transaction
      .update(learningSessions)
      .set({ status: LEARNING_SESSION_STATUS.ABANDONED, updatedAt: new Date() })
      .where(inArray(learningSessions.id, abandonedIds));
  }

  await transaction
    .update(learningSessions)
    .set({ userId: destinationUserId, updatedAt: new Date() })
    .where(eq(learningSessions.userId, sourceUserId));
}

async function mergeWordProgressForTransfer(
  transaction: LearningTransaction,
  sourceUserId: string,
  destinationUserId: string,
) {
  const rows = await transaction
    .select()
    .from(userWordProgress)
    .where(
      or(eq(userWordProgress.userId, sourceUserId), eq(userWordProgress.userId, destinationUserId)),
    )
    .for('update');
  const destinationByWordSense = new Map(
    rows.filter((row) => row.userId === destinationUserId).map((row) => [row.wordSenseId, row]),
  );
  const sourceRows = rows.filter((row) => row.userId === sourceUserId);

  for (const source of sourceRows) {
    const destination = destinationByWordSense.get(source.wordSenseId);

    if (destination) {
      const merged = mergeWordProgress(source, destination);
      await transaction
        .update(userWordProgress)
        .set({ ...merged, updatedAt: new Date() })
        .where(
          and(
            eq(userWordProgress.userId, destinationUserId),
            eq(userWordProgress.wordSenseId, source.wordSenseId),
          ),
        );
      await transaction
        .delete(userWordProgress)
        .where(
          and(
            eq(userWordProgress.userId, sourceUserId),
            eq(userWordProgress.wordSenseId, source.wordSenseId),
          ),
        );
      continue;
    }

    await transaction
      .update(userWordProgress)
      .set({ userId: destinationUserId, updatedAt: new Date() })
      .where(
        and(
          eq(userWordProgress.userId, sourceUserId),
          eq(userWordProgress.wordSenseId, source.wordSenseId),
        ),
      );
  }
}
