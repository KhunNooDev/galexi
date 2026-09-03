import { phonemize } from 'phonemize';

export function getEnglishIpaAutofillValue(
  word: string,
  pronunciationIpa: string | undefined,
  lastGeneratedIpa: string | null,
): string | null {
  const trimmedWord = word.trim();

  if (!trimmedWord) {
    return lastGeneratedIpa !== null && pronunciationIpa === lastGeneratedIpa ? '' : null;
  }

  const canAutoFill = !pronunciationIpa || pronunciationIpa === lastGeneratedIpa;

  if (!canAutoFill) {
    return null;
  }

  return phonemize(trimmedWord, 'en-US');
}
