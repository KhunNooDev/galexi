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
import { ok } from '@/server/api/response';
import { idParamSchema } from '@/server/api/validation';

function notFoundResponse() {
  return new Response('404 Not Found', {
    headers: { 'content-type': 'text/plain; charset=UTF-8' },
    status: 404,
  });
}

const wordImageCleanupRoutes = new Elysia({ name: 'word-image-cleanup-routes' })
  .use(requireAdmin)
  .post(
    API_PATH.WORD_IMAGE_CLEANUP,
    async ({ body }) => {
      const result = await cleanupUnreferencedWordImage(body.imageUrl);

      return ok(result);
    },
    {
      body: wordImageCleanupSchema,
    },
  );

export const wordImageRoutes = new Elysia({ name: 'word-image-routes' })
  // Native image response: private resources intentionally look missing to non-admins.
  .get(
    API_PATH.WORD_IMAGE_BY_ID,
    async ({ params }) => {
      const word = await getWordById(params.id);

      if (!word?.imageUrl) {
        return notFoundResponse();
      }

      if (!word.isPublic) {
        const identity = await getCurrentIdentity();

        if (identity.kind !== IDENTITY_KIND.ADMIN) {
          return notFoundResponse();
        }
      }

      const imageUrl = await getWordImageUrl(word.imageUrl);

      if (!imageUrl) {
        return notFoundResponse();
      }

      return Response.redirect(imageUrl, 307);
    },
    {
      params: idParamSchema,
    },
  )
  .use(wordImageCleanupRoutes);
