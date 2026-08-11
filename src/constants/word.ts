export const WORD_LIMITS = {
  WORD_MAX_LENGTH: 120,
  PRONUNCIATION_MAX_LENGTH: 160,
  PART_OF_SPEECH_MAX_LENGTH: 80,
  MEANING_MAX_LENGTH: 200,
  MEANINGS_MAX_COUNT: 10,
  EXAMPLE_MAX_LENGTH: 1_000,
  IMAGE_URL_MAX_LENGTH: 2_048,
  CATEGORIES_MAX_COUNT: 20,
} as const;

export const WORD_IMAGE = {
  ACCEPTED_TYPES: ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'],
  BUCKET: 'word-images',
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

const STORED_WORD_IMAGE_PATH_PATTERN =
  /^words\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(avif|gif|jpe?g|png|webp)$/i;

export function getStoredWordImagePath(value: string) {
  if (!value) {
    return null;
  }

  let path = value;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const marker = `/storage/v1/object/public/${WORD_IMAGE.BUCKET}/`;
      const pathname = new URL(value).pathname;
      const markerIndex = pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      path = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  }

  return STORED_WORD_IMAGE_PATH_PATTERN.test(path) ? path : null;
}
