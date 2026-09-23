import { afterEach, describe, expect, it } from 'vitest';

import { getTrustedProxies } from './trusted-proxies.js';

describe('getTrustedProxies', () => {
  const originalTrustedProxies = process.env.TRUSTED_PROXIES;

  afterEach(() => {
    if (originalTrustedProxies === undefined) {
      delete process.env.TRUSTED_PROXIES;
    } else {
      process.env.TRUSTED_PROXIES = originalTrustedProxies;
    }
  });

  it('returns false when no trusted proxies are configured', () => {
    delete process.env.TRUSTED_PROXIES;

    expect(getTrustedProxies()).toBe(false);
  });

  it('returns one configured proxy', () => {
    process.env.TRUSTED_PROXIES = '172.18.0.5';

    expect(getTrustedProxies()).toEqual(['172.18.0.5']);
  });

  it('returns multiple configured proxies', () => {
    process.env.TRUSTED_PROXIES = '172.18.0.5,172.19.0.7';

    expect(getTrustedProxies()).toEqual(['172.18.0.5', '172.19.0.7']);
  });

  it('trims whitespace and removes duplicates', () => {
    process.env.TRUSTED_PROXIES = ' 172.18.0.5 , 172.19.0.7 , 172.18.0.5 ';

    expect(getTrustedProxies()).toEqual(['172.18.0.5', '172.19.0.7']);
  });

  it('returns false for an empty configuration', () => {
    process.env.TRUSTED_PROXIES = '   ';

    expect(getTrustedProxies()).toBe(false);
  });
});
