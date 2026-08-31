import 'server-only';

import { Elysia } from 'elysia';

import { API_PATH } from '@/constants/api';
import { IDENTITY_KIND } from '@/constants/identity';
import { getWordById } from '@/features/words/server/word.service';
import {
  cleanupUnreferencedWordImage,
  getWordImageUrl,
} from '@/features/words/server/word-image.service';
import { wordImageCleanupSchema } from '@/features/words/word.schema';
import { getCurrentIdentity } from '@/lib/supabase/auth';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import { idParamSchema } from '@/server/api/validation';

const wordImageCleanupRoutes = new Elysia({ name: 'word-image-cleanup-routes' })
  .use(requireAdmin)
  .post(
    API_PATH.WORD_IMAGE_CLEANUP,
    async ({ body, status }) => {
      try {
        return await cleanupUnreferencedWordImage(body.imageUrl);
      } catch (error) {
        console.error('Unable to clean up the unreferenced Word image', error);
        return status(500, { error: 'Unable to clean up Word image' });
      }
    },
    { body: wordImageCleanupSchema },
  );

export const wordImageRoutes = new Elysia({ name: 'word-image-routes' })
  .get(
    API_PATH.WORD_IMAGE_BY_ID,
    async ({ params }) => {
      const word = await getWordById(params.id);

      if (!word?.imageUrl) {
        return new Response('404 Not Found', {
          headers: { 'content-type': 'text/plain; charset=UTF-8' },
          status: 404,
        });
      }

      if (!word.isPublic) {
        const identity = await getCurrentIdentity();

        if (identity.kind !== IDENTITY_KIND.ADMIN) {
          return new Response('404 Not Found', {
            headers: { 'content-type': 'text/plain; charset=UTF-8' },
            status: 404,
          });
        }
      }

      const imageUrl = await getWordImageUrl(word.imageUrl);

      return imageUrl
        ? Response.redirect(imageUrl, 307)
        : new Response('404 Not Found', {
            headers: { 'content-type': 'text/plain; charset=UTF-8' },
            status: 404,
          });
    },
    { params: idParamSchema },
  )
  .use(wordImageCleanupRoutes);
