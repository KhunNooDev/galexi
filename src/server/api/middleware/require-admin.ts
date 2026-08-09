import 'server-only';

import type { MiddlewareHandler } from 'hono';

import { USER_ROLE } from '@/constants/role';
import { getCurrentUserId } from '@/lib/supabase/auth';
import type { ApiEnvironment } from '@/server/api/types';
import { getUserRole } from '@/server/roles';

export const requireAdmin: MiddlewareHandler<ApiEnvironment> = async (context, next) => {
  const adminUserId = await getCurrentUserId();

  if (!adminUserId) {
    return context.json({ error: 'Unauthorized' }, 401);
  }

  if ((await getUserRole(adminUserId)) !== USER_ROLE.ADMIN) {
    return context.json({ error: 'Forbidden' }, 403);
  }

  context.set('adminUserId', adminUserId);
  await next();
};
