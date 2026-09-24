import { describe, expect, it, vi } from 'vitest';

import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { AuditController } from './audit.controller.js';

function getMethod(methodName: keyof AuditController): Function {
  const descriptor = Object.getOwnPropertyDescriptor(AuditController.prototype, methodName);

  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(`Method "${String(methodName)}" not found on AuditController.`);
  }

  return descriptor.value;
}

describe('AuditController', () => {
  it('requires platform.audit.read for the audit route', () => {
    const capability = Reflect.getMetadata(
      PLATFORM_CAPABILITY_METADATA_KEY,
      getMethod('getAuditEvents'),
    );

    expect(capability).toBe('platform.audit.read');
  });

  it('forwards query filters to AuditService', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 50,
      total: 0,
    });

    const controller = new AuditController({
      list,
    } as never);

    const query = {
      page: 2,
      pageSize: 50,
      action: 'auth.login.failed',
      result: 'failure' as const,
      actorType: 'anonymous',
      requestId: 'request-123',
    };

    await expect(controller.getAuditEvents(query)).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 50,
      total: 0,
    });

    expect(list).toHaveBeenCalledWith(query);
  });
});
