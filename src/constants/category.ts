export const CATEGORY_LIMITS = {
  NAME_MAX_LENGTH: 80,
  REORDER_MAX_COUNT: 500,
  SLUG_MAX_LENGTH: 80,
  SORT_ORDER_MAX: 10_000,
} as const;

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
