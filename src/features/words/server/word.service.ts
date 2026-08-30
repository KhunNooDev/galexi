import 'server-only';

import { and, asc, desc, eq, ilike, max, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { words, wordSenseCategories, wordSenses } from '@/db/schema';
import {
  ensureWordImageExists,
  getWordImageLockQuery,
} from '@/features/words/server/word-image.service';
import type { WordInput } from '@/features/words/word.schema';

const baseWordSenseColumns = {
  id: wordSenses.id,
  wordId: wordSenses.wordId,
  word: words.word,
  senseOrder: wordSenses.senseOrder,
  pronunciationIpa: wordSenses.pronunciationIpa,
  pronunciationThai: wordSenses.pronunciationThai,
  partOfSpeech: wordSenses.partOfSpeech,
  meaningsTh: wordSenses.meaningsTh,
  exampleSentence: wordSenses.exampleSentence,
  exampleSentenceMeaningTh: wordSenses.exampleSentenceMeaningTh,
  imageUrl: wordSenses.imageUrl,
  isPublic: wordSenses.isPublic,
};

const wordSenseColumns = {
  ...baseWordSenseColumns,
  categories: sql<{ id: number; name: string; slug: string }[]>`
    coalesce(
      (
        select json_agg(
          json_build_object('id', category.id, 'name', category.name, 'slug', category.slug)
          order by category.sort_order, category.name
        )
        from word_sense_categories relationship
        inner join categories category on category.id = relationship.category_id
        where relationship.word_sense_id = ${wordSenses.id}
      ),
      '[]'::json
    )
  `,
};

type WordTransaction = Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0];

function getCanonicalWordLockKey(word: string) {
  return `galexi:word:${word.trim().toLowerCase()}`;
}

async function lockCanonicalWords(transaction: WordTransaction, spellings: readonly string[]) {
  const lockKeys = [...new Set(spellings.map(getCanonicalWordLockKey))].sort();

  for (const lockKey of lockKeys) {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }
}

async function findOrCreateCanonicalWordAfterLock(
  transaction: WordTransaction,
  adminUserId: string,
  spelling: string,
) {
  const [existingWord] = await transaction
    .select({ id: words.id })
    .from(words)
    .where(sql`lower(${words.word}) = lower(${spelling})`)
    .limit(1);

  if (existingWord) {
    return existingWord.id;
  }

  const [createdWord] = await transaction
    .insert(words)
    .values({ createdBy: adminUserId, updatedBy: adminUserId, word: spelling })
    .returning({ id: words.id });

  return createdWord.id;
}

async function findOrCreateCanonicalWord(
  transaction: WordTransaction,
  adminUserId: string,
  spelling: string,
) {
  await lockCanonicalWords(transaction, [spelling]);
  return findOrCreateCanonicalWordAfterLock(transaction, adminUserId, spelling);
}

async function getNextSenseOrder(
  transaction: WordTransaction,
  wordId: number,
  partOfSpeech: string,
) {
  const [result] = await transaction
    .select({ value: max(wordSenses.senseOrder) })
    .from(wordSenses)
    .where(
      and(
        eq(wordSenses.wordId, wordId),
        sql`lower(${wordSenses.partOfSpeech}) = lower(${partOfSpeech})`,
      ),
    );

  return (result?.value ?? 0) + 1;
}

export async function listWords() {
  return getDatabase()
    .select(wordSenseColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .orderBy(desc(wordSenses.createdAt), desc(wordSenses.id));
}

export async function getWordById(id: number) {
  const [wordSense] = await getDatabase()
    .select(wordSenseColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .where(eq(wordSenses.id, id))
    .limit(1);

  return wordSense ?? null;
}

export async function createWord(adminUserId: string, values: WordInput) {
  const { categoryIds, word, ...senseValues } = values;
  const wordSenseId = await getDatabase().transaction(async (transaction) => {
    if (senseValues.imageUrl) {
      await transaction.execute(getWordImageLockQuery(senseValues.imageUrl));
      await ensureWordImageExists(senseValues.imageUrl);
    }

    const wordId = await findOrCreateCanonicalWord(transaction, adminUserId, word);
    const senseOrder = await getNextSenseOrder(transaction, wordId, senseValues.partOfSpeech);
    const [createdWordSense] = await transaction
      .insert(wordSenses)
      .values({
        ...senseValues,
        createdBy: adminUserId,
        senseOrder,
        updatedBy: adminUserId,
        wordId,
      })
      .returning({ id: wordSenses.id });

    if (categoryIds.length > 0) {
      await transaction.insert(wordSenseCategories).values(
        categoryIds.map((categoryId) => ({
          categoryId,
          wordSenseId: createdWordSense.id,
        })),
      );
    }

    return createdWordSense.id;
  });

  return getWordById(wordSenseId);
}

export async function updateWord(id: number, adminUserId: string, values: WordInput) {
  const { categoryIds, word, ...senseValues } = values;
  const updated = await getDatabase().transaction(async (transaction) => {
    const [currentWordSense] = await transaction
      .select({
        imageUrl: wordSenses.imageUrl,
        partOfSpeech: wordSenses.partOfSpeech,
        senseOrder: wordSenses.senseOrder,
        word: words.word,
        wordId: wordSenses.wordId,
      })
      .from(wordSenses)
      .innerJoin(words, eq(words.id, wordSenses.wordId))
      .where(eq(wordSenses.id, id))
      .limit(1)
      .for('update', { of: wordSenses });

    if (!currentWordSense) {
      return false;
    }

    if (senseValues.imageUrl) {
      await transaction.execute(getWordImageLockQuery(senseValues.imageUrl));

      if (currentWordSense.imageUrl !== senseValues.imageUrl) {
        await ensureWordImageExists(senseValues.imageUrl);
      }
    }

    await lockCanonicalWords(transaction, [currentWordSense.word, word]);
    const targetWordId = await findOrCreateCanonicalWordAfterLock(transaction, adminUserId, word);
    const identityChanged =
      targetWordId !== currentWordSense.wordId ||
      senseValues.partOfSpeech.toLowerCase() !== currentWordSense.partOfSpeech.toLowerCase();
    const senseOrder = identityChanged
      ? await getNextSenseOrder(transaction, targetWordId, senseValues.partOfSpeech)
      : currentWordSense.senseOrder;
    const [updatedWordSense] = await transaction
      .update(wordSenses)
      .set({
        ...senseValues,
        senseOrder,
        updatedBy: adminUserId,
        wordId: targetWordId,
      })
      .where(eq(wordSenses.id, id))
      .returning({ id: wordSenses.id });

    if (!updatedWordSense) {
      return false;
    }

    await transaction
      .update(words)
      .set({ updatedBy: adminUserId, word })
      .where(eq(words.id, targetWordId));
    await transaction.delete(wordSenseCategories).where(eq(wordSenseCategories.wordSenseId, id));

    if (categoryIds.length > 0) {
      await transaction
        .insert(wordSenseCategories)
        .values(categoryIds.map((categoryId) => ({ categoryId, wordSenseId: id })));
    }

    if (targetWordId !== currentWordSense.wordId) {
      await transaction
        .delete(words)
        .where(
          and(
            eq(words.id, currentWordSense.wordId),
            sql`not exists (select 1 from ${wordSenses} where ${wordSenses.wordId} = ${currentWordSense.wordId})`,
          ),
        );
    }

    return true;
  });

  return updated ? getWordById(id) : null;
}

export async function deleteWord(id: number) {
  return getDatabase().transaction(async (transaction) => {
    const [currentWordSense] = await transaction
      .select({ word: words.word, wordId: wordSenses.wordId })
      .from(wordSenses)
      .innerJoin(words, eq(words.id, wordSenses.wordId))
      .where(eq(wordSenses.id, id))
      .limit(1)
      .for('update', { of: wordSenses });

    if (!currentWordSense) {
      return null;
    }

    await lockCanonicalWords(transaction, [currentWordSense.word]);

    const [deletedWordSense] = await transaction
      .delete(wordSenses)
      .where(and(eq(wordSenses.id, id), eq(wordSenses.wordId, currentWordSense.wordId)))
      .returning({ id: wordSenses.id, wordId: wordSenses.wordId });

    if (!deletedWordSense) {
      return null;
    }

    await transaction
      .delete(words)
      .where(
        and(
          eq(words.id, deletedWordSense.wordId),
          sql`not exists (select 1 from ${wordSenses} where ${wordSenses.wordId} = ${deletedWordSense.wordId})`,
        ),
      );

    return { id: deletedWordSense.id };
  });
}

export function listPublicWordSummaries(query = '') {
  const normalizedWord = sql<string>`lower(${words.word})`;
  const normalizedQuery = query.trim();

  return getDatabase()
    .select({
      word: sql<string>`min(${words.word})`,
      entries: sql<number>`count(${wordSenses.id})::int`,
    })
    .from(words)
    .innerJoin(wordSenses, and(eq(wordSenses.wordId, words.id), eq(wordSenses.isPublic, true)))
    .where(normalizedQuery ? ilike(words.word, `%${normalizedQuery}%`) : undefined)
    .groupBy(normalizedWord)
    .orderBy(asc(normalizedWord));
}

export async function listPublicWordEntries(word: string) {
  return getDatabase()
    .select(wordSenseColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .where(sql`${wordSenses.isPublic} = true and lower(${words.word}) = lower(${word})`)
    .orderBy(asc(wordSenses.partOfSpeech), asc(wordSenses.senseOrder), asc(wordSenses.id));
}
