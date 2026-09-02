import 'server-only';

import { and, asc, count, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { categories, words, wordSenseCategories, wordSenses } from '@/db/schema';
import type { CategoryInput } from '@/features/categories/category.schema';

const categoryColumns = {
  id: categories.id,
  name: categories.name,
  slug: categories.slug,
  sortOrder: categories.sortOrder,
};

const publicWordColumns = {
  id: wordSenses.id,
  wordId: wordSenses.wordId,
  word: words.word,
  senseOrder: wordSenses.senseOrder,
  pronunciationIpa: wordSenses.pronunciationIpa,
  pronunciationThai: wordSenses.pronunciationThai,
  partOfSpeech: wordSenses.partOfSpeech,
  meaningsTh: wordSenses.meaningsTh,
  imageUrl: wordSenses.imageUrl,
};

// Admin queries

export function listCategories() {
  return getDatabase()
    .select({
      ...categoryColumns,
      wordCount: count(wordSenseCategories.wordSenseId).mapWith(Number),
    })
    .from(categories)
    .leftJoin(wordSenseCategories, eq(wordSenseCategories.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

// Public queries

export function listPublicCategories(query = '') {
  const normalizedQuery = query.trim();

  return getDatabase()
    .select({
      ...categoryColumns,
      wordCount: sql<number>`count(distinct ${wordSenseCategories.wordSenseId})::int`,
    })
    .from(categories)
    .innerJoin(wordSenseCategories, eq(wordSenseCategories.categoryId, categories.id))
    .innerJoin(
      wordSenses,
      and(eq(wordSenses.id, wordSenseCategories.wordSenseId), eq(wordSenses.isPublic, true)),
    )
    .where(normalizedQuery ? ilike(categories.name, `%${normalizedQuery}%`) : undefined)
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getPublicCategory(slug: string) {
  const [category] = await getDatabase()
    .select({
      ...categoryColumns,
      wordCount: sql<number>`count(distinct ${wordSenseCategories.wordSenseId})::int`,
    })
    .from(categories)
    .innerJoin(wordSenseCategories, eq(wordSenseCategories.categoryId, categories.id))
    .innerJoin(
      wordSenses,
      and(eq(wordSenses.id, wordSenseCategories.wordSenseId), eq(wordSenses.isPublic, true)),
    )
    .where(sql`lower(${categories.slug}) = lower(${slug})`)
    .groupBy(categories.id)
    .limit(1);

  return category ?? null;
}

export function listPublicWordsByCategory(
  categoryId: number,
  filters: { partOfSpeech?: string; query?: string },
) {
  const query = filters.query?.trim();
  const partOfSpeech = filters.partOfSpeech?.trim();
  const predicates = [
    eq(wordSenseCategories.categoryId, categoryId),
    eq(wordSenses.isPublic, true),
    partOfSpeech ? sql`lower(${wordSenses.partOfSpeech}) = lower(${partOfSpeech})` : undefined,
    query
      ? or(
          ilike(words.word, `%${query}%`),
          sql`array_to_string(${wordSenses.meaningsTh}, ' ') ilike ${`%${query}%`}`,
        )
      : undefined,
  ].filter((predicate) => predicate !== undefined);

  return getDatabase()
    .select(publicWordColumns)
    .from(wordSenses)
    .innerJoin(words, eq(words.id, wordSenses.wordId))
    .innerJoin(wordSenseCategories, eq(wordSenseCategories.wordSenseId, wordSenses.id))
    .where(and(...predicates))
    .orderBy(asc(words.word), asc(wordSenses.partOfSpeech), asc(wordSenses.senseOrder));
}

// Mutations

export async function createCategory(values: CategoryInput) {
  const [category] = await getDatabase()
    .insert(categories)
    .values(values)
    .returning(categoryColumns);

  return { ...category, wordCount: 0 };
}

export async function updateCategory(id: number, values: CategoryInput) {
  const [category] = await getDatabase()
    .update(categories)
    .set(values)
    .where(eq(categories.id, id))
    .returning(categoryColumns);

  if (!category) {
    return null;
  }

  const [countResult] = await getDatabase()
    .select({ wordCount: count(wordSenseCategories.wordSenseId).mapWith(Number) })
    .from(wordSenseCategories)
    .where(eq(wordSenseCategories.categoryId, id));

  return { ...category, wordCount: countResult.wordCount };
}

export async function deleteCategory(id: number) {
  const [category] = await getDatabase()
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  return category ?? null;
}

export async function reorderCategories(categoryIds: number[]) {
  await getDatabase().transaction(async (transaction) => {
    for (const [sortOrder, id] of categoryIds.entries()) {
      await transaction.update(categories).set({ sortOrder }).where(eq(categories.id, id));
    }
  });

  return listCategories();
}

export async function categoriesExist(categoryIds: number[]) {
  if (categoryIds.length === 0) {
    return true;
  }

  const rows = await getDatabase()
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, categoryIds));

  return rows.length === new Set(categoryIds).size;
}
