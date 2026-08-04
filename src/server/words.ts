import 'server-only';

import { asc, desc, eq, sql } from 'drizzle-orm';

import { getDatabase } from '@/db';
import type { NewWord } from '@/db/schema';
import { words } from '@/db/schema';

const wordColumns = {
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

export type DictionaryEntryInput = Pick<
  NewWord,
  | 'word'
  | 'pronunciationIpa'
  | 'pronunciationThai'
  | 'partOfSpeech'
  | 'meaningsTh'
  | 'exampleSentence'
  | 'exampleSentenceMeaningTh'
  | 'imageUrl'
  | 'isPublic'
>;

export function listWords() {
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

export async function createWord(adminUserId: string, values: DictionaryEntryInput) {
  const [word] = await getDatabase()
    .insert(words)
    .values({ ...values, createdBy: adminUserId, updatedBy: adminUserId })
    .returning(wordColumns);

  return word;
}

export async function updateWord(id: number, adminUserId: string, values: DictionaryEntryInput) {
  const [word] = await getDatabase()
    .update(words)
    .set({ ...values, updatedBy: adminUserId })
    .where(eq(words.id, id))
    .returning(wordColumns);

  return word ?? null;
}

export async function deleteWord(id: number) {
  const [deletedWord] = await getDatabase()
    .delete(words)
    .where(eq(words.id, id))
    .returning({ id: words.id });

  return deletedWord ?? null;
}

export function listPublicWordSummaries() {
  const normalizedWord = sql<string>`lower(${words.word})`;

  return getDatabase()
    .select({
      word: sql<string>`min(${words.word})`,
      entries: sql<number>`count(*)::int`,
    })
    .from(words)
    .where(eq(words.isPublic, true))
    .groupBy(normalizedWord)
    .orderBy(asc(normalizedWord));
}

export function listPublicWordEntries(word: string) {
  return getDatabase()
    .select(wordColumns)
    .from(words)
    .where(sql`${words.isPublic} = true and lower(${words.word}) = lower(${word})`)
    .orderBy(asc(words.partOfSpeech), asc(words.id));
}
