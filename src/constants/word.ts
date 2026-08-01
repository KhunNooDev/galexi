export const WORD_LIMITS = {
  WORD_MAX_LENGTH: 120,
  PRONUNCIATION_MAX_LENGTH: 160,
  PART_OF_SPEECH_MAX_LENGTH: 80,
  MEANING_MAX_LENGTH: 200,
  MEANINGS_MAX_COUNT: 10,
  EXAMPLE_MAX_LENGTH: 1_000,
  IMAGE_URL_MAX_LENGTH: 2_048,
} as const;

export const WORD_IMAGE = {
  ACCEPTED_TYPES: ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'],
  BUCKET: 'word-images',
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

export function getStoredWordImagePath(value: string) {
  if (!value) {
    return null;
  }

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value;
  }

  try {
    const marker = `/storage/v1/object/public/${WORD_IMAGE.BUCKET}/`;
    const pathname = new URL(value).pathname;
    const markerIndex = pathname.indexOf(marker);

    return markerIndex === -1
      ? null
      : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
