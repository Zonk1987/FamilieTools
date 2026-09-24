import { describe, expect, it } from 'vitest';

import {
  CORE_AUDIT_ACTIONS,
  CORE_AUDIT_ACTOR_TYPES,
  CORE_AUDIT_RESULTS,
  CORE_AUDIT_SCOPE_TYPES,
  CORE_AUDIT_TARGET_TYPES,
} from './audit.events.js';

describe('Core audit contracts', () => {
  it('keeps authentication audit action names stable', () => {
    expect(CORE_AUDIT_ACTIONS).toEqual({
      AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded',
      AUTH_LOGIN_FAILED: 'auth.login.failed',
      AUTH_LOGOUT: 'auth.logout',
    });
  });

  it('keeps core actor types stable', () => {
    expect(CORE_AUDIT_ACTOR_TYPES).toEqual({
      USER: 'user',
      ANONYMOUS: 'anonymous',
      SYSTEM: 'system',
    });
  });

  it('keeps core scope types stable', () => {
    expect(CORE_AUDIT_SCOPE_TYPES).toEqual({
      PLATFORM: 'platform',
      WORKSPACE: 'workspace',
      DOMAIN: 'domain',
      MODULE_INSTANCE: 'module-instance',
    });
  });

  it('keeps core target types stable', () => {
    expect(CORE_AUDIT_TARGET_TYPES).toEqual({
      AUTH_SESSION: 'auth-session',
    });
  });

  it('keeps audit result values stable', () => {
    expect(CORE_AUDIT_RESULTS).toEqual({
      SUCCESS: 'success',
      FAILURE: 'failure',
      DENIED: 'denied',
    });
  });
});
