import { z } from 'zod';

import { WORD_LIMITS } from '@/constants/word';

type WordValidationMessages = {
  meaningsRequired: string;
  tooLong: string;
  tooManyMeanings: string;
  wordRequired: string;
};

function optionalText(maxLength: number, message?: string) {
  return z.string().trim().max(maxLength, message);
}

function createCategoryIdsSchema() {
  return z
    .array(z.number().int().positive())
    .max(WORD_LIMITS.CATEGORIES_MAX_COUNT)
    .refine((ids) => new Set(ids).size === ids.length);
}

function createWordFields(messages: Partial<WordValidationMessages> = {}) {
  return {
    word: z
      .string()
      .trim()
      .min(1, messages.wordRequired)
      .max(WORD_LIMITS.WORD_MAX_LENGTH, messages.tooLong),
    pronunciationIpa: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH, messages.tooLong),
    pronunciationThai: optionalText(WORD_LIMITS.PRONUNCIATION_MAX_LENGTH, messages.tooLong),
    partOfSpeech: optionalText(WORD_LIMITS.PART_OF_SPEECH_MAX_LENGTH, messages.tooLong),
    meaningsTh: z
      .array(z.string().trim().min(1).max(WORD_LIMITS.MEANING_MAX_LENGTH))
      .min(1, messages.meaningsRequired)
      .max(WORD_LIMITS.MEANINGS_MAX_COUNT, messages.tooManyMeanings),
    exampleSentence: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH, messages.tooLong),
    exampleSentenceMeaningTh: optionalText(WORD_LIMITS.EXAMPLE_MAX_LENGTH, messages.tooLong),
    imageUrl: optionalText(WORD_LIMITS.IMAGE_URL_MAX_LENGTH, messages.tooLong),
    isPublic: z.boolean(),
    categoryIds: createCategoryIdsSchema(),
  };
}

export function createWordFormSchema(messages: WordValidationMessages) {
  return z.object(createWordFields(messages));
}

const wordBaseSchema = z.object(createWordFields());

export const wordInputSchema = wordBaseSchema.extend({
  pronunciationIpa: wordBaseSchema.shape.pronunciationIpa.default(''),
  pronunciationThai: wordBaseSchema.shape.pronunciationThai.default(''),
  partOfSpeech: wordBaseSchema.shape.partOfSpeech.default(''),
  exampleSentence: wordBaseSchema.shape.exampleSentence.default(''),
  exampleSentenceMeaningTh: wordBaseSchema.shape.exampleSentenceMeaningTh.default(''),
  imageUrl: wordBaseSchema.shape.imageUrl.default(''),
  isPublic: wordBaseSchema.shape.isPublic.default(false),
  categoryIds: wordBaseSchema.shape.categoryIds.default([]),
});

export type WordFormValues = z.output<ReturnType<typeof createWordFormSchema>>;
export type WordInput = z.output<typeof wordInputSchema>;
