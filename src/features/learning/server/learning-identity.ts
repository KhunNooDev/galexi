import 'server-only';

import type { AuthenticatedAppIdentity } from '@/constants/identity';
import { IDENTITY_KIND } from '@/constants/identity';
import { getCurrentIdentity } from '@/lib/supabase/auth';

export async function requireLearningIdentity(): Promise<AuthenticatedAppIdentity> {
  const identity = await getCurrentIdentity();

  if (identity.kind === IDENTITY_KIND.PUBLIC) {
    throw new Error('Authentication required');
  }

  return identity;
}
