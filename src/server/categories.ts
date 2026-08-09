import 'server-only';

import { and, asc, count, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { categories, wordCategories, words } from '@/db/schema';

export type CategoryInput = {
  name: string;
  slug: string;
  sortOrder: number;
};

const categoryColumns = {
  id: categories.id,
  name: categories.name,
  slug: categories.slug,
  sortOrder: categories.sortOrder,
};

const publicWordColumns = {
  id: words.id,
  word: words.word,
  pronunciationIpa: words.pronunciationIpa,
  pronunciationThai: words.pronunciationThai,
  partOfSpeech: words.partOfSpeech,
  meaningsTh: words.meaningsTh,
  imageUrl: words.imageUrl,
};

export function listCategories() {
  return getDatabase()
    .select({ ...categoryColumns, wordCount: count(wordCategories.wordId).mapWith(Number) })
    .from(categories)
    .leftJoin(wordCategories, eq(wordCategories.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export function listPublicCategories(query = '') {
  const normalizedQuery = query.trim();

  return getDatabase()
    .select({
      ...categoryColumns,
      wordCount: sql<number>`count(distinct ${wordCategories.wordId})::int`,
    })
    .from(categories)
    .innerJoin(wordCategories, eq(wordCategories.categoryId, categories.id))
    .innerJoin(words, and(eq(words.id, wordCategories.wordId), eq(words.isPublic, true)))
    .where(normalizedQuery ? ilike(categories.name, `%${normalizedQuery}%`) : undefined)
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getPublicCategory(slug: string) {
  const [category] = await getDatabase()
    .select({
      ...categoryColumns,
      wordCount: sql<number>`count(distinct ${wordCategories.wordId})::int`,
    })
    .from(categories)
    .innerJoin(wordCategories, eq(wordCategories.categoryId, categories.id))
    .innerJoin(words, and(eq(words.id, wordCategories.wordId), eq(words.isPublic, true)))
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
    eq(wordCategories.categoryId, categoryId),
    eq(words.isPublic, true),
    partOfSpeech ? sql`lower(${words.partOfSpeech}) = lower(${partOfSpeech})` : undefined,
    query
      ? or(
          ilike(words.word, `%${query}%`),
          sql`array_to_string(${words.meaningsTh}, ' ') ilike ${`%${query}%`}`,
        )
      : undefined,
  ].filter((predicate) => predicate !== undefined);

  return getDatabase()
    .select(publicWordColumns)
    .from(words)
    .innerJoin(wordCategories, eq(wordCategories.wordId, words.id))
    .where(and(...predicates))
    .orderBy(asc(words.word), asc(words.partOfSpeech));
}

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

  const [{ wordCount }] = await getDatabase()
    .select({ wordCount: count(wordCategories.wordId).mapWith(Number) })
    .from(wordCategories)
    .where(eq(wordCategories.categoryId, id));

  return { ...category, wordCount };
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
