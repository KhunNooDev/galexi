import { z } from 'zod';

import { CATEGORY_LIMITS, CATEGORY_SLUG_PATTERN } from '@/constants/category';

type CategoryValidationMessages = {
  invalidSlug: string;
  nameRequired: string;
  required: string;
  sortOrderInvalid: string;
  tooLong: string;
};

function createCategoryInputSchema(messages: Partial<CategoryValidationMessages> = {}) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(CATEGORY_LIMITS.NAME_MAX_LENGTH, messages.tooLong),
    slug: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(CATEGORY_LIMITS.SLUG_MAX_LENGTH, messages.tooLong)
      .regex(CATEGORY_SLUG_PATTERN, messages.invalidSlug),
    sortOrder: z
      .number()
      .int(messages.sortOrderInvalid)
      .min(0, messages.sortOrderInvalid)
      .max(CATEGORY_LIMITS.SORT_ORDER_MAX, messages.sortOrderInvalid),
  });
}

export const categoryInputSchema = createCategoryInputSchema();

export function createCategoryFormSchema(messages: CategoryValidationMessages) {
  const domainSchema = createCategoryInputSchema(messages);

  return z.object({
    name: domainSchema.shape.name,
    slug: domainSchema.shape.slug,
    sortOrder: z
      .string()
      .regex(/^\d+$/, messages.sortOrderInvalid)
      .transform(Number)
      .pipe(domainSchema.shape.sortOrder),
  });
}

export type CategoryFormInput = z.input<ReturnType<typeof createCategoryFormSchema>>;
export type CategoryFormValues = z.output<ReturnType<typeof createCategoryFormSchema>>;
export type CategoryInput = z.output<typeof categoryInputSchema>;
