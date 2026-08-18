export const LEARNING_ACCOUNT_TRANSFER_STATUS = {
  CONSUMED: 'consumed',
  EXPIRED: 'expired',
  PENDING: 'pending',
} as const;

export const LEARNING_ACCOUNT_TRANSFER = {
  COOKIE_NAME: 'galexi-learning-transfer',
  RETENTION_DAYS: 7,
  TOKEN_BYTES: 32,
  TOKEN_TTL_MINUTES: 15,
} as const;
