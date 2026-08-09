export const API_PATH = {
  BASE: '/api',
  //========================================
  CATEGORIES: '/categories',
  CATEGORIES_REORDER: '/categories/reorder',
  CATEGORIES_WILDCARD: '/categories/*',
  CATEGORY_BY_ID: '/categories/:id',
  //========================================
  WORD_IMAGE_BY_ID: '/word-images/:id',
  WORD_BY_ID: '/words/:id',
  WORDS: '/words',
  WORDS_WILDCARD: '/words/*',
} as const;
