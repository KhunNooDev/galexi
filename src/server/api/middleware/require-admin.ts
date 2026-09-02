import 'server-only';

import { Elysia } from 'elysia';

import { IDENTITY_KIND } from '@/constants/identity';
import { getCurrentIdentity } from '@/lib/supabase/auth';
import { API_ERROR_CODE } from '@/server/api/error-codes';
import { forbidden, unauthorized } from '@/server/api/response';

// This scoped middleware adds adminUserId to protected route context.
export const requireAdmin = new Elysia({ name: 'require-admin' }).derive(
  { as: 'scoped' },
  async () => {
    const identity = await getCurrentIdentity();

    if (identity.kind === IDENTITY_KIND.PUBLIC || identity.kind === IDENTITY_KIND.GUEST) {
      return unauthorized(API_ERROR_CODE.UNAUTHORIZED, 'Unauthorized');
    }

    if (identity.kind !== IDENTITY_KIND.ADMIN) {
      return forbidden(API_ERROR_CODE.FORBIDDEN, 'Forbidden');
    }

    return { adminUserId: identity.userId };
  },
);
