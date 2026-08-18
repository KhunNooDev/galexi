import { describe, expect, it } from 'vitest';

import {
  createLearningTransferToken,
  hashLearningTransferToken,
} from '@/features/learning/account/account-transfer-token';

describe('learning transfer tokens', () => {
  it('creates opaque one-time bearer values and stores only a stable hash', () => {
    const first = createLearningTransferToken();
    const second = createLearningTransferToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(hashLearningTransferToken(first)).toHaveLength(64);
    expect(hashLearningTransferToken(first)).not.toContain(first);
    expect(hashLearningTransferToken(first)).toBe(hashLearningTransferToken(first));
  });
});
