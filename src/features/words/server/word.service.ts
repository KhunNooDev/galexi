import 'server-only';

import { getDatabase } from '@/db';
import {
  assignWordSenseCategories,
  createWordSense,
  deleteCanonicalWordIfUnused,
  deleteWordSense,
  findWordSenseById,
  findWordSenseForUpdate,
  getNextSenseOrder,
  listPublicWordEntriesFromDatabase,
  listPublicWordSummariesFromDatabase,
  listWordSenses,
  lockCanonicalWords,
  replaceWordSenseCategories,
  resolveCanonicalWord,
  resolveCanonicalWordAfterLock,
  updateCanonicalWord,
  updateWordSense,
  type WordTransaction,
} from '@/features/words/server/word.repository';
import {
  ensureWordImageExists,
  getWordImageLockQuery,
} from '@/features/words/server/word-image.service';
import type { WordInput } from '@/features/words/word.schema';

async function validateWordImage(
  transaction: WordTransaction,
  imageUrl: string,
  currentImageUrl?: string,
) {
  if (!imageUrl) {
    return;
  }

  await transaction.execute(getWordImageLockQuery(imageUrl));

  if (imageUrl !== currentImageUrl) {
    await ensureWordImageExists(imageUrl);
  }
}

export function listWords() {
  return listWordSenses();
}

export function getWordById(id: number) {
  return findWordSenseById(id);
}

export async function createWord(adminUserId: string, values: WordInput) {
  const { categoryIds, word, ...senseValues } = values;
  const wordSenseId = await getDatabase().transaction(async (transaction) => {
    await validateWordImage(transaction, senseValues.imageUrl);

    const wordId = await resolveCanonicalWord(transaction, adminUserId, word);
    const senseOrder = await getNextSenseOrder(transaction, wordId, senseValues.partOfSpeech);
    const createdWordSenseId = await createWordSense(
      transaction,
      adminUserId,
      wordId,
      senseOrder,
      senseValues,
    );

    await assignWordSenseCategories(transaction, createdWordSenseId, categoryIds);

    return createdWordSenseId;
  });

  return findWordSenseById(wordSenseId);
}

export async function updateWord(id: number, adminUserId: string, values: WordInput) {
  const { categoryIds, word, ...senseValues } = values;
  const updated = await getDatabase().transaction(async (transaction) => {
    const currentWordSense = await findWordSenseForUpdate(transaction, id);

    if (!currentWordSense) {
      return false;
    }

    await validateWordImage(transaction, senseValues.imageUrl, currentWordSense.imageUrl);
    await lockCanonicalWords(transaction, [currentWordSense.word, word]);

    const targetWordId = await resolveCanonicalWordAfterLock(transaction, adminUserId, word);
    const identityChanged =
      targetWordId !== currentWordSense.wordId ||
      senseValues.partOfSpeech.toLowerCase() !== currentWordSense.partOfSpeech.toLowerCase();
    const senseOrder = identityChanged
      ? await getNextSenseOrder(transaction, targetWordId, senseValues.partOfSpeech)
      : currentWordSense.senseOrder;
    const updatedWordSenseId = await updateWordSense(
      transaction,
      id,
      adminUserId,
      targetWordId,
      senseOrder,
      senseValues,
    );

    if (!updatedWordSenseId) {
      return false;
    }

    await updateCanonicalWord(transaction, targetWordId, adminUserId, word);
    await replaceWordSenseCategories(transaction, id, categoryIds);

    if (targetWordId !== currentWordSense.wordId) {
      await deleteCanonicalWordIfUnused(transaction, currentWordSense.wordId);
    }

    return true;
  });

  return updated ? findWordSenseById(id) : null;
}

export async function deleteWord(id: number) {
  return getDatabase().transaction(async (transaction) => {
    const currentWordSense = await findWordSenseForUpdate(transaction, id);

    if (!currentWordSense) {
      return null;
    }

    await lockCanonicalWords(transaction, [currentWordSense.word]);

    const deletedWordSense = await deleteWordSense(transaction, id, currentWordSense.wordId);

    if (!deletedWordSense) {
      return null;
    }

    await deleteCanonicalWordIfUnused(transaction, deletedWordSense.wordId);

    return { id: deletedWordSense.id };
  });
}

export function listPublicWordSummaries(query = '') {
  return listPublicWordSummariesFromDatabase(query);
}

export function listPublicWordEntries(word: string) {
  return listPublicWordEntriesFromDatabase(word);
}
