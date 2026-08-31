export const API_PATH = {
  BASE: '/api',
  //========================================
  CATEGORIES: '/categories',
  CATEGORIES_REORDER: '/categories/reorder',
  CATEGORY_BY_ID: '/categories/:id',
  //========================================
  WORD_IMAGE_BY_ID: '/word-images/:id',
  WORD_IMAGE_CLEANUP: '/word-images/cleanup',
  WORD_BY_ID: '/words/:id',
  WORDS: '/words',
} as const;
