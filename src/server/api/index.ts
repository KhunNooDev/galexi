import 'server-only';

import { Elysia } from 'elysia';
import { WebStandardAdapter } from 'elysia/adapter/web-standard';

import { API_PATH } from '@/constants/api';
import { categoryRoutes } from '@/features/categories/server/category.routes';
import { wordRoutes } from '@/features/words/server/word.routes';
import { wordImageRoutes } from '@/features/words/server/word-image.routes';
import { API_ERROR_CODE } from '@/server/api/error-codes';
import { badRequest, internalServerError } from '@/server/api/response';

export const api = new Elysia({
  adapter: WebStandardAdapter,
  prefix: API_PATH.BASE,
})
  .onError(({ code, error }) => {
    if (code === 'VALIDATION' || code === 'PARSE') {
      return badRequest(API_ERROR_CODE.INVALID_REQUEST, 'Invalid request');
    }

    if (code === 'NOT_FOUND') {
      return new Response('404 Not Found', {
        headers: { 'content-type': 'text/plain; charset=UTF-8' },
        status: 404,
      });
    }

    console.error(error);
    return internalServerError(API_ERROR_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  })
  .use(wordImageRoutes)
  .use(categoryRoutes)
  .use(wordRoutes);

export type Api = typeof api;
