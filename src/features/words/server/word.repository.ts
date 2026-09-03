import 'server-only';

import { and, asc, count, desc, eq, ilike, max, or, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { words, wordSenseCategories, wordSenses } from '@/db/schema';
import type { WordInput } from '@/features/words/word.schema';
import type { WordListParams } from '@/features/words/word-list';

export type WordTransaction = Parameters<
  Parameters<ReturnType<typeof getDatabase>['transaction']>[0]
>[0];

export type WordSenseValues = Omit<WordInput, 'categoryIds' | 'word'>;

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

function getCanonicalWordLockKey(word: string) {
  return `galexi:word:${word.trim().toLowerCase()}`;
}

export async function lockCanonicalWords(
  transaction: WordTransaction,
  spellings: readonly string[],
) {
  const lockKeys = [...new Set(spellings.map(getCanonicalWordLockKey))].sort();

  // Keep lock ordering deterministic to avoid deadlocks between concurrent updates.
  for (const lockKey of lockKeys) {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }
}

export async function resolveCanonicalWordAfterLock(
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

export async function resolveCanonicalWord(
  transaction: WordTransaction,
  adminUserId: string,
  spelling: string,
) {
  await lockCanonicalWords(transaction, [spelling]);
  return resolveCanonicalWordAfterLock(transaction, adminUserId, spelling);
}

export async function getNextSenseOrder(
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

export async function listWordSenses(params: WordListParams) {
  const normalizedQuery = params.query.trim();
  const predicates = [
    normalizedQuery
      ? or(
          ilike(words.word, `%${normalizedQuery}%`),
          ilike(wordSenses.partOfSpeech, `%${normalizedQuery}%`),
          ilike(wordSenses.pronunciationIpa, `%${normalizedQuery}%`),
          ilike(wordSenses.pronunciationThai, `%${normalizedQuery}%`),
          sql`array_to_string(${wordSenses.meaningsTh}, ' ') ilike ${`%${normalizedQuery}%`}`,
        )
      : undefined,
    params.partOfSpeech
      ? sql`lower(${wordSenses.partOfSpeech}) = lower(${params.partOfSpeech})`
      : undefined,
    params.categoryId
      ? sql`exists (
          select 1
          from ${wordSenseCategories}
          where ${wordSenseCategories.wordSenseId} = ${wordSenses.id}
            and ${wordSenseCategories.categoryId} = ${params.categoryId}
        )`
      : undefined,
  ].filter((predicate) => predicate !== undefined);
  const where = predicates.length > 0 ? and(...predicates) : undefined;
  const order =
    params.sort === 'word-ascending'
      ? [asc(words.word), asc(wordSenses.id)]
      : params.sort === 'word-descending'
        ? [desc(words.word), desc(wordSenses.id)]
        : [desc(wordSenses.createdAt), desc(wordSenses.id)];
  const database = getDatabase();
  const [items, [countResult]] = await Promise.all([
    database
      .select(wordSenseColumns)
      .from(wordSenses)
      .innerJoin(words, eq(words.id, wordSenses.wordId))
      .where(where)
      .orderBy(...order)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    database
      .select({ total: count().mapWith(Number) })
      .from(wordSenses)
      .innerJoin(words, eq(words.id, wordSenses.wordId))
      .where(where),
  ]);

  return { page: params.page, total: countResult.total, words: items };
}

export async function findWordSenseById(id: number) {
  const [wordSense] = await getDatabase()
    .select(wordSenseColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .where(eq(wordSenses.id, id))
    .limit(1);

  return wordSense ?? null;
}

export async function findWordSenseForUpdate(transaction: WordTransaction, id: number) {
  const [wordSense] = await transaction
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

  return wordSense ?? null;
}

export async function createWordSense(
  transaction: WordTransaction,
  adminUserId: string,
  wordId: number,
  senseOrder: number,
  values: WordSenseValues,
) {
  const [createdWordSense] = await transaction
    .insert(wordSenses)
    .values({
      ...values,
      createdBy: adminUserId,
      senseOrder,
      updatedBy: adminUserId,
      wordId,
    })
    .returning({ id: wordSenses.id });

  return createdWordSense.id;
}

export async function updateWordSense(
  transaction: WordTransaction,
  id: number,
  adminUserId: string,
  wordId: number,
  senseOrder: number,
  values: WordSenseValues,
) {
  const [updatedWordSense] = await transaction
    .update(wordSenses)
    .set({
      ...values,
      senseOrder,
      updatedBy: adminUserId,
      wordId,
    })
    .where(eq(wordSenses.id, id))
    .returning({ id: wordSenses.id });

  return updatedWordSense?.id ?? null;
}

export async function updateCanonicalWord(
  transaction: WordTransaction,
  wordId: number,
  adminUserId: string,
  spelling: string,
) {
  await transaction
    .update(words)
    .set({ updatedBy: adminUserId, word: spelling })
    .where(eq(words.id, wordId));
}

export async function assignWordSenseCategories(
  transaction: WordTransaction,
  wordSenseId: number,
  categoryIds: number[],
) {
  if (categoryIds.length > 0) {
    await transaction.insert(wordSenseCategories).values(
      categoryIds.map((categoryId) => ({
        categoryId,
        wordSenseId,
      })),
    );
  }
}

export async function replaceWordSenseCategories(
  transaction: WordTransaction,
  wordSenseId: number,
  categoryIds: number[],
) {
  await transaction
    .delete(wordSenseCategories)
    .where(eq(wordSenseCategories.wordSenseId, wordSenseId));
  await assignWordSenseCategories(transaction, wordSenseId, categoryIds);
}

export async function deleteWordSense(transaction: WordTransaction, id: number, wordId: number) {
  const [deletedWordSense] = await transaction
    .delete(wordSenses)
    .where(and(eq(wordSenses.id, id), eq(wordSenses.wordId, wordId)))
    .returning({ id: wordSenses.id, wordId: wordSenses.wordId });

  return deletedWordSense ?? null;
}

export async function deleteCanonicalWordIfUnused(transaction: WordTransaction, wordId: number) {
  await transaction
    .delete(words)
    .where(
      and(
        eq(words.id, wordId),
        sql`not exists (select 1 from ${wordSenses} where ${wordSenses.wordId} = ${wordId})`,
      ),
    );
}

export function listPublicWordSummariesFromDatabase(query = '') {
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

export function listPublicWordEntriesFromDatabase(word: string) {
  return getDatabase()
    .select(wordSenseColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .where(sql`${wordSenses.isPublic} = true and lower(${words.word}) = lower(${word})`)
    .orderBy(asc(wordSenses.partOfSpeech), asc(wordSenses.senseOrder), asc(wordSenses.id));
}
