import { createHash, randomBytes } from 'node:crypto';

import { LEARNING_ACCOUNT_TRANSFER } from '@/features/learning/account/account.constants';

export function createLearningTransferToken() {
  return randomBytes(LEARNING_ACCOUNT_TRANSFER.TOKEN_BYTES).toString('base64url');
}

export function hashLearningTransferToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
