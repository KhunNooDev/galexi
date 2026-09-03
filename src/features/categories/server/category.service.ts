import 'server-only';

import { and, asc, count, desc, eq, gt, ilike, inArray, lt, max, or, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { categories, words, wordSenseCategories, wordSenses } from '@/db/schema';
import type { CategoryInput } from '@/features/categories/category.schema';
import type { CategoryListParams } from '@/features/categories/category-list';

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

export async function listCategoryPage(params: CategoryListParams) {
  const normalizedQuery = params.query.trim();
  const where = normalizedQuery
    ? or(
        ilike(categories.name, `%${normalizedQuery}%`),
        ilike(categories.slug, `%${normalizedQuery}%`),
      )
    : undefined;
  const database = getDatabase();
  const [items, [countResult], [orderResult]] = await Promise.all([
    database
      .select({
        ...categoryColumns,
        wordCount: count(wordSenseCategories.wordSenseId).mapWith(Number),
      })
      .from(categories)
      .leftJoin(wordSenseCategories, eq(wordSenseCategories.categoryId, categories.id))
      .where(where)
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name), asc(categories.id))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize),
    database
      .select({ total: count().mapWith(Number) })
      .from(categories)
      .where(where),
    database
      .select({ highestSortOrder: max(categories.sortOrder).mapWith(Number) })
      .from(categories),
  ]);

  return {
    categories: items,
    nextSortOrder: (orderResult.highestSortOrder ?? -1) + 1,
    page: params.page,
    total: countResult.total,
  };
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

export async function moveCategory(id: number, direction: -1 | 1) {
  return getDatabase().transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended('galexi:category-order', 0))`,
    );

    const [current] = await transaction
      .select({ id: categories.id, name: categories.name, sortOrder: categories.sortOrder })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1)
      .for('update');

    if (!current) {
      return false;
    }

    const beforeCurrent = or(
      lt(categories.sortOrder, current.sortOrder),
      and(eq(categories.sortOrder, current.sortOrder), lt(categories.name, current.name)),
      and(
        eq(categories.sortOrder, current.sortOrder),
        eq(categories.name, current.name),
        lt(categories.id, current.id),
      ),
    );
    const afterCurrent = or(
      gt(categories.sortOrder, current.sortOrder),
      and(eq(categories.sortOrder, current.sortOrder), gt(categories.name, current.name)),
      and(
        eq(categories.sortOrder, current.sortOrder),
        eq(categories.name, current.name),
        gt(categories.id, current.id),
      ),
    );
    const [target] = await transaction
      .select({ id: categories.id, sortOrder: categories.sortOrder })
      .from(categories)
      .where(direction === -1 ? beforeCurrent : afterCurrent)
      .orderBy(
        direction === -1 ? desc(categories.sortOrder) : asc(categories.sortOrder),
        direction === -1 ? desc(categories.name) : asc(categories.name),
        direction === -1 ? desc(categories.id) : asc(categories.id),
      )
      .limit(1)
      .for('update');

    if (!target) {
      return false;
    }

    if (current.sortOrder === target.sortOrder) {
      await transaction.execute(sql`
        with ranked as (
          select
            ${categories.id} as id,
            (row_number() over (
              order by ${categories.sortOrder}, ${categories.name}, ${categories.id}
            ) - 1)::integer as sort_order
          from ${categories}
        ),
        desired as (
          select
            id,
            case
              when id = ${current.id} then (
                select sort_order from ranked where id = ${target.id}
              )
              when id = ${target.id} then (
                select sort_order from ranked where id = ${current.id}
              )
              else sort_order
            end as sort_order
          from ranked
        )
        update ${categories}
        set sort_order = desired.sort_order
        from desired
        where ${categories.id} = desired.id
          and ${categories.sortOrder} is distinct from desired.sort_order
      `);
    } else {
      await transaction
        .update(categories)
        .set({
          sortOrder: sql<number>`case
            when ${categories.id} = ${current.id} then ${target.sortOrder}
            else ${current.sortOrder}
          end`,
        })
        .where(inArray(categories.id, [current.id, target.id]));
    }

    return true;
  });
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
