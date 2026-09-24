export const CORE_AUDIT_ACTIONS = {
  AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGOUT: 'auth.logout',
} as const;

export type CoreAuditAction = (typeof CORE_AUDIT_ACTIONS)[keyof typeof CORE_AUDIT_ACTIONS];

export const CORE_AUDIT_ACTOR_TYPES = {
  USER: 'user',
  ANONYMOUS: 'anonymous',
  SYSTEM: 'system',
} as const;

export const CORE_AUDIT_SCOPE_TYPES = {
  PLATFORM: 'platform',
  WORKSPACE: 'workspace',
  DOMAIN: 'domain',
  MODULE_INSTANCE: 'module-instance',
} as const;

export const CORE_AUDIT_TARGET_TYPES = {
  AUTH_SESSION: 'auth-session',
} as const;

export const CORE_AUDIT_RESULTS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  DENIED: 'denied',
} as const;

export type CoreAuditResult = (typeof CORE_AUDIT_RESULTS)[keyof typeof CORE_AUDIT_RESULTS];
