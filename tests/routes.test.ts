import { describe, expect, it } from 'vitest';

import { getSafeAuthReturnTo } from '@/constants/routes';

describe('safe authentication return routes', () => {
  it('allows only supported internal application routes', () => {
    expect(getSafeAuthReturnTo('/learn/save?step=password')).toBe('/learn/save?step=password');
    expect(getSafeAuthReturnTo('/admin/words/4')).toBe('/admin/words/4');
  });

  it('rejects open redirects and unsupported paths', () => {
    expect(getSafeAuthReturnTo('https://example.com')).toBeNull();
    expect(getSafeAuthReturnTo('//example.com')).toBeNull();
    expect(getSafeAuthReturnTo('/\\example.com')).toBeNull();
    expect(getSafeAuthReturnTo('/api/words')).toBeNull();
  });
});
