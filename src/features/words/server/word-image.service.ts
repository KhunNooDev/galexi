import 'server-only';

import { getStoredWordImagePath, WORD_IMAGE } from '@/constants/word';
import { createClient } from '@/lib/supabase/server';

export async function getWordImageUrl(imageReference: string) {
  const path = getStoredWordImagePath(imageReference);

  if (!path) {
    return imageReference || null;
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

export async function removeWordImage(imageReference: string) {
  const path = getStoredWordImagePath(imageReference);

  if (!path) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(WORD_IMAGE.BUCKET).remove([path]);

  if (error) {
    throw error;
  }
}
