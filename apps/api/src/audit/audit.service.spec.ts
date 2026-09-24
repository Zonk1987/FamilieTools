import { describe, expect, it, vi } from 'vitest';

import { AuditRepository } from './audit.repository.js';
import { AuditService } from './audit.service.js';

function createService() {
  const append = vi.fn().mockImplementation(async (data) => ({
    id: 'audit-id',
    actorType: data.actorType,
    actorId: data.actorId ?? null,
    scopeType: data.scopeType ?? null,
    scopeId: data.scopeId ?? null,
    action: data.action,
    targetType: data.targetType ?? null,
    targetId: data.targetId ?? null,
    result: data.result,
    requestId: data.requestId ?? null,
    metadata: data.metadata ?? {},
    createdAt: new Date('2026-09-24T00:00:00.000Z'),
  }));

  const repository = {
    append,
  } as unknown as AuditRepository;

  const service = new AuditService(repository);

  return {
    service,
    append,
  };
}

describe('AuditService', () => {
  it('appends a normalized audit event', async () => {
    const { service, append } = createService();

    await service.append({
      actor: {
        type: ' user ',
        id: ' user-123 ',
      },
      action: ' auth.login.succeeded ',
      result: 'success',
      scope: {
        type: ' platform ',
      },
      target: {
        type: ' session ',
        id: ' session-123 ',
      },
      requestId: ' request-123 ',
      metadata: {
        source: 'web',
      },
    });

    expect(append).toHaveBeenCalledWith(
      {
        actorType: 'user',
        actorId: 'user-123',
        scopeType: 'platform',
        scopeId: null,
        action: 'auth.login.succeeded',
        targetType: 'session',
        targetId: 'session-123',
        result: 'success',
        requestId: 'request-123',
        metadata: {
          source: 'web',
        },
      },
      undefined,
    );
  });

  it('rejects an empty actor type', async () => {
    const { service, append } = createService();

    await expect(
      service.append({
        actor: {
          type: '   ',
        },
        action: 'auth.login.failed',
        result: 'failure',
      }),
    ).rejects.toThrow('actor.type must not be empty');

    expect(append).not.toHaveBeenCalled();
  });

  it('rejects an empty action', async () => {
    const { service, append } = createService();

    await expect(
      service.append({
        actor: {
          type: 'system',
        },
        action: '   ',
        result: 'failure',
      }),
    ).rejects.toThrow('action must not be empty');

    expect(append).not.toHaveBeenCalled();
  });

  it('redacts sensitive metadata recursively', async () => {
    const { service, append } = createService();

    await service.append({
      actor: {
        type: 'user',
        id: 'user-123',
      },
      action: 'auth.login.failed',
      result: 'failure',
      metadata: {
        loginName: 'sebastian',
        password: 'secret-password',
        nested: {
          token: 'secret-token',
          safeValue: 'allowed',
          deeper: {
            apiKey: 'secret-api-key',
          },
        },
        items: [
          {
            clientSecret: 'secret-client',
            safeItem: true,
          },
        ],
      },
    });

    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          loginName: 'sebastian',
          password: '[REDACTED]',
          nested: {
            token: '[REDACTED]',
            safeValue: 'allowed',
            deeper: {
              apiKey: '[REDACTED]',
            },
          },
          items: [
            {
              clientSecret: '[REDACTED]',
              safeItem: true,
            },
          ],
        },
      }),
      undefined,
    );
  });

  it('preserves non-sensitive metadata', async () => {
    const { service, append } = createService();

    await service.append({
      actor: {
        type: 'system',
      },
      action: 'module.installed',
      result: 'success',
      metadata: {
        moduleId: 'gaming.minecraft',
        version: '1.2.3',
        durationMs: 250,
        healthy: true,
      },
    });

    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          moduleId: 'gaming.minecraft',
          version: '1.2.3',
          durationMs: 250,
          healthy: true,
        },
      }),
      undefined,
    );
  });

  it('allows scope and target to be omitted', async () => {
    const { service, append } = createService();

    await service.append({
      actor: {
        type: 'system',
      },
      action: 'maintenance.completed',
      result: 'success',
    });

    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'system',
        actorId: null,
        scopeType: null,
        scopeId: null,
        targetType: null,
        targetId: null,
        requestId: null,
        metadata: {},
      }),
      undefined,
    );
  });

  it('uses default pagination when list options are omitted', async () => {
    const append = vi.fn();

    const list = vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      total: 0,
    });

    const repository = {
      append,
      list,
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    await service.list();

    expect(list).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 25,

        action: undefined,
        result: undefined,

        actorType: undefined,
        actorId: undefined,

        scopeType: undefined,
        scopeId: undefined,

        targetType: undefined,
        targetId: undefined,

        requestId: undefined,

        createdFrom: undefined,
        createdTo: undefined,
      },
      undefined,
    );
  });

  it('normalizes list filters and passes them to the repository', async () => {
    const append = vi.fn();

    const list = vi.fn().mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 50,
      total: 0,
    });

    const repository = {
      append,
      list,
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    const createdFrom = new Date('2026-09-01T00:00:00.000Z');

    const createdTo = new Date('2026-09-30T23:59:59.999Z');

    await service.list({
      page: 2,
      pageSize: 50,

      action: ' auth.login.failed ',
      result: 'failure',

      actorType: ' anonymous ',
      actorId: ' actor-1 ',

      scopeType: ' platform ',
      scopeId: '11111111-1111-4111-8111-111111111111',

      targetType: ' auth-session ',
      targetId: ' session-1 ',

      requestId: ' request-123 ',

      createdFrom,
      createdTo,
    });

    expect(list).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 50,

        action: 'auth.login.failed',
        result: 'failure',

        actorType: 'anonymous',
        actorId: 'actor-1',

        scopeType: 'platform',
        scopeId: '11111111-1111-4111-8111-111111111111',

        targetType: 'auth-session',
        targetId: 'session-1',

        requestId: 'request-123',

        createdFrom,
        createdTo,
      },
      undefined,
    );
  });

  it('removes empty string filters', async () => {
    const append = vi.fn();

    const list = vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      total: 0,
    });

    const repository = {
      append,
      list,
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    await service.list({
      action: '   ',
      actorType: '   ',
      actorId: '   ',
      scopeType: '   ',
      scopeId: '   ',
      targetType: '   ',
      targetId: '   ',
      requestId: '   ',
    });

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        action: undefined,
        actorType: undefined,
        actorId: undefined,
        scopeType: undefined,
        scopeId: undefined,
        targetType: undefined,
        targetId: undefined,
        requestId: undefined,
      }),
      undefined,
    );
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid page value %s',
    async (page) => {
      const repository = {
        append: vi.fn(),
        list: vi.fn(),
      } as unknown as AuditRepository;

      const service = new AuditService(repository);

      await expect(
        service.list({
          page,
        }),
      ).rejects.toThrow('page must be an integer greater than or equal to 1');
    },
  );

  it.each([0, -1, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid pageSize value %s',
    async (pageSize) => {
      const repository = {
        append: vi.fn(),
        list: vi.fn(),
      } as unknown as AuditRepository;

      const service = new AuditService(repository);

      await expect(
        service.list({
          pageSize,
        }),
      ).rejects.toThrow('pageSize must be an integer between 1 and 100');
    },
  );

  it('rejects an invalid createdFrom date', async () => {
    const repository = {
      append: vi.fn(),
      list: vi.fn(),
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    await expect(
      service.list({
        createdFrom: new Date('invalid'),
      }),
    ).rejects.toThrow('createdFrom must be a valid date');
  });

  it('rejects an invalid createdTo date', async () => {
    const repository = {
      append: vi.fn(),
      list: vi.fn(),
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    await expect(
      service.list({
        createdTo: new Date('invalid'),
      }),
    ).rejects.toThrow('createdTo must be a valid date');
  });

  it('rejects a reversed date range', async () => {
    const repository = {
      append: vi.fn(),
      list: vi.fn(),
    } as unknown as AuditRepository;

    const service = new AuditService(repository);

    await expect(
      service.list({
        createdFrom: new Date('2026-09-30T00:00:00.000Z'),
        createdTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('createdFrom must not be after createdTo');
  });
});
