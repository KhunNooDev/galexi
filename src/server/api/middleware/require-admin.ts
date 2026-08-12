import 'server-only';

import type { MiddlewareHandler } from 'hono';

import { IDENTITY_KIND } from '@/constants/identity';
import { getCurrentIdentity } from '@/lib/supabase/auth';
import type { ApiEnvironment } from '@/server/api/types';

export const requireAdmin: MiddlewareHandler<ApiEnvironment> = async (context, next) => {
  const identity = await getCurrentIdentity();

  if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
    return context.json({ error: 'Unauthorized' }, 401);
  }

  if (identity.kind !== IDENTITY_KIND.ADMIN) {
    return context.json({ error: 'Forbidden' }, 403);
  }

  context.set('adminUserId', identity.userId);
  await next();
};
