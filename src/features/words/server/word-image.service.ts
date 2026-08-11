import 'server-only';

import { eq, sql } from 'drizzle-orm';

import { getStoredWordImagePath, WORD_IMAGE } from '@/constants/word';
import { getDatabase } from '@/db';
import { words } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export function getWordImageLockQuery(path: string) {
  return sql`select pg_advisory_xact_lock(
    hashtextextended(${`galexi:word-image:${path}`}, 0)
  )`;
}

export async function ensureWordImageExists(imageReference: string) {
  const path = getStoredWordImagePath(imageReference);

  if (!path) {
    throw new Error('Invalid Word image reference');
  }

  const supabase = await createClient();
  const { data: exists, error } = await supabase.storage.from(WORD_IMAGE.BUCKET).exists(path);

  if (error) {
    throw error;
  }

  if (!exists) {
    throw new Error('Word image does not exist');
  }
}

export async function getWordImageUrl(imageReference: string) {
  const path = getStoredWordImagePath(imageReference);

  if (!path) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(WORD_IMAGE.BUCKET)
    .createSignedUrl(path, 60 * 5);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function cleanupUnreferencedWordImage(imageReference: string) {
  const path = getStoredWordImagePath(imageReference);

  if (!path) {
    return { removed: false };
  }

  return getDatabase().transaction(async (transaction) => {
    await transaction.execute(getWordImageLockQuery(path));

    const [referencedWord] = await transaction
      .select({ id: words.id })
      .from(words)
      .where(eq(words.imageUrl, path))
      .limit(1);

    if (referencedWord) {
      return { removed: false };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage.from(WORD_IMAGE.BUCKET).remove([path]);

    if (error) {
      throw error;
    }

    return { removed: data.length > 0 };
  });
}
