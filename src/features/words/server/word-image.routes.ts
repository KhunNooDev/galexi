import 'server-only';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { API_PATH } from '@/constants/api';
import { USER_ROLE } from '@/constants/role';
import { getWordById } from '@/features/words/server/word.service';
import { getWordImageUrl } from '@/features/words/server/word-image.service';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { idParamSchema } from '@/server/api/validation';
import { getUserRole } from '@/server/roles';

export const wordImageRoutes = new Hono().get(
  API_PATH.WORD_IMAGE_BY_ID,
  zValidator('param', idParamSchema),
  async (context) => {
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
  },
);
