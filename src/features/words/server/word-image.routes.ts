import 'server-only';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { API_PATH } from '@/constants/api';
import { USER_ROLE } from '@/constants/role';
import { getWordById } from '@/features/words/server/word.service';
import {
  cleanupUnreferencedWordImage,
  getWordImageUrl,
} from '@/features/words/server/word-image.service';
import { wordImageCleanupSchema } from '@/features/words/word.schema';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { requireAdmin } from '@/server/api/middleware/require-admin';
import type { ApiEnvironment } from '@/server/api/types';
import { idParamSchema } from '@/server/api/validation';
import { getUserRole } from '@/server/roles';

export const wordImageRoutes = new Hono<ApiEnvironment>()
  .post(
    API_PATH.WORD_IMAGE_CLEANUP,
    requireAdmin,
    zValidator('json', wordImageCleanupSchema),
    async (context) => {
      const { imageUrl } = context.req.valid('json');

      try {
        return context.json(await cleanupUnreferencedWordImage(imageUrl), 200);
      } catch (error) {
        console.error('Unable to clean up the unreferenced Word image', error);
        return context.json({ error: 'Unable to clean up Word image' }, 500);
      }
    },
  )
  .get(API_PATH.WORD_IMAGE_BY_ID, zValidator('param', idParamSchema), async (context) => {
    const { id } = context.req.valid('param');
    const word = await getWordById(id);

    if (!word?.imageUrl) {
      return context.notFound();
    }

    if (!word.isPublic) {
      const userId = await getCurrentUserId();

      if (!userId || (await getUserRole(userId)) !== USER_ROLE.ADMIN) {
        return context.notFound();
      }
    }

    const imageUrl = await getWordImageUrl(word.imageUrl);

    return imageUrl ? context.redirect(imageUrl, 307) : context.notFound();
  });
