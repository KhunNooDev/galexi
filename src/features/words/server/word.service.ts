import 'server-only';

import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import { wordCategories, words } from '@/db/schema';
import {
  ensureWordImageExists,
  getWordImageLockQuery,
} from '@/features/words/server/word-image.service';
import type { WordInput } from '@/features/words/word.schema';

const baseWordColumns = {
  id: words.id,
  word: words.word,
  pronunciationIpa: words.pronunciationIpa,
  pronunciationThai: words.pronunciationThai,
  partOfSpeech: words.partOfSpeech,
  meaningsTh: words.meaningsTh,
  exampleSentence: words.exampleSentence,
  exampleSentenceMeaningTh: words.exampleSentenceMeaningTh,
  imageUrl: words.imageUrl,
  isPublic: words.isPublic,
};

const wordColumns = {
  ...baseWordColumns,
  categories: sql<{ id: number; name: string; slug: string }[]>`
    coalesce(
      (
        select json_agg(
          json_build_object('id', category.id, 'name', category.name, 'slug', category.slug)
          order by category.sort_order, category.name
        )
        from word_categories relationship
        inner join categories category on category.id = relationship.category_id
        where relationship.word_id = ${words.id}
      ),
      '[]'::json
    )
  `,
};

export async function listWords() {
  return getDatabase()
    .select(wordColumns)
    .from(words)
    .orderBy(desc(words.createdAt), desc(words.id));
}

export async function getWordById(id: number) {
  const [word] = await getDatabase()
    .select(wordColumns)
    .from(words)
    .where(eq(words.id, id))
    .limit(1);

  return word ?? null;
}

export async function createWord(adminUserId: string, values: WordInput) {
  const { categoryIds, ...wordValues } = values;
  const wordId = await getDatabase().transaction(async (transaction) => {
    if (wordValues.imageUrl) {
      await transaction.execute(getWordImageLockQuery(wordValues.imageUrl));
      await ensureWordImageExists(wordValues.imageUrl);
    }

    const [createdWord] = await transaction
      .insert(words)
      .values({ ...wordValues, createdBy: adminUserId, updatedBy: adminUserId })
      .returning({ id: words.id });

    if (categoryIds.length > 0) {
      await transaction
        .insert(wordCategories)
        .values(categoryIds.map((categoryId) => ({ categoryId, wordId: createdWord.id })));
    }

    return createdWord.id;
  });

  return getWordById(wordId);
}

export async function updateWord(id: number, adminUserId: string, values: WordInput) {
  const { categoryIds, ...wordValues } = values;
  const updated = await getDatabase().transaction(async (transaction) => {
    if (wordValues.imageUrl) {
      await transaction.execute(getWordImageLockQuery(wordValues.imageUrl));

      const [currentWord] = await transaction
        .select({ imageUrl: words.imageUrl })
        .from(words)
        .where(eq(words.id, id))
        .limit(1);

      if (!currentWord) {
        return null;
      }

      if (currentWord.imageUrl !== wordValues.imageUrl) {
        await ensureWordImageExists(wordValues.imageUrl);
      }
    }

    const [updatedWord] = await transaction
      .update(words)
      .set({ ...wordValues, updatedBy: adminUserId })
      .where(eq(words.id, id))
      .returning({ id: words.id });

    if (!updatedWord) {
      return null;
    }

    await transaction.delete(wordCategories).where(eq(wordCategories.wordId, id));

    if (categoryIds.length > 0) {
      await transaction
        .insert(wordCategories)
        .values(categoryIds.map((categoryId) => ({ categoryId, wordId: id })));
    }

    return true;
  });

  return updated ? getWordById(id) : null;
}

export async function deleteWord(id: number) {
  const [deletedWord] = await getDatabase()
    .delete(words)
    .where(eq(words.id, id))
    .returning({ id: words.id });

  return deletedWord ?? null;
}

export function listPublicWordSummaries(query = '') {
  const normalizedWord = sql<string>`lower(${words.word})`;
  const normalizedQuery = query.trim();

  return getDatabase()
    .select({
      word: sql<string>`min(${words.word})`,
      entries: sql<number>`count(*)::int`,
    })
    .from(words)
    .where(
      normalizedQuery
        ? and(eq(words.isPublic, true), ilike(words.word, `%${normalizedQuery}%`))
        : eq(words.isPublic, true),
    )
    .groupBy(normalizedWord)
    .orderBy(asc(normalizedWord));
}

export async function listPublicWordEntries(word: string) {
  return getDatabase()
    .select(wordColumns)
    .from(words)
    .where(sql`${words.isPublic} = true and lower(${words.word}) = lower(${word})`)
    .orderBy(asc(words.partOfSpeech), asc(words.id));
}
