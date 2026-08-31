import 'server-only';

import { Elysia, status } from 'elysia';

import { IDENTITY_KIND } from '@/constants/identity';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export const requireAdmin = new Elysia({ name: 'require-admin' }).derive(
  { as: 'scoped' },
  async () => {
    const identity = await getCurrentIdentity();

    if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
      return status(401, { error: 'Unauthorized' });
    }

    if (identity.kind !== IDENTITY_KIND.ADMIN) {
      return status(403, { error: 'Forbidden' });
    }

    return { adminUserId: identity.userId };
  },
);
