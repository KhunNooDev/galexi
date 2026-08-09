import 'server-only';

import { Hono } from 'hono';

import { API_PATH } from '@/constants/api';
import { categoryRoutes } from '@/features/categories/server/category.routes';
import { wordRoutes } from '@/features/words/server/word.routes';
import { wordImageRoutes } from '@/features/words/server/word-image.routes';
import type { ApiEnvironment } from '@/server/api/types';

export const api = new Hono<ApiEnvironment>()
  .basePath(API_PATH.BASE)
  .route('/', wordImageRoutes)
  .route('/', categoryRoutes)
  .route('/', wordRoutes)
  .onError((error, context) => {
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

export type ApiType = typeof api;
