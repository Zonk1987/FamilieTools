import { afterEach, describe, expect, it } from 'vitest';

import {
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  shouldUseSecureSessionCookie,
} from './session-cookie.js';

describe('session cookie policy', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecureFlag = process.env.SESSION_COOKIE_SECURE;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalSecureFlag === undefined) {
      delete process.env.SESSION_COOKIE_SECURE;
    } else {
      process.env.SESSION_COOKIE_SECURE = originalSecureFlag;
    }
  });

  it('does not require Secure cookies in development by default', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SESSION_COOKIE_SECURE;

    expect(shouldUseSecureSessionCookie()).toBe(false);
  });

  it('requires Secure cookies in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_COOKIE_SECURE;

    expect(shouldUseSecureSessionCookie()).toBe(true);
  });

  it('allows Secure cookies to be forced outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.SESSION_COOKIE_SECURE = 'true';

    expect(shouldUseSecureSessionCookie()).toBe(true);
  });

  it('does not allow production Secure cookies to be disabled explicitly', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_COOKIE_SECURE = 'false';

    expect(shouldUseSecureSessionCookie()).toBe(true);
  });

  it('uses hardened session cookie defaults', () => {
    process.env.NODE_ENV = 'production';

    const expires = new Date('2026-10-01T00:00:00.000Z');

    expect(getSessionCookieOptions(expires)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires,
    });
  });

  it('uses matching attributes when clearing the session cookie', () => {
    process.env.NODE_ENV = 'production';

    expect(getClearSessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});
