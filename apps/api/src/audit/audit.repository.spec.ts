import { describe, expect, it, vi } from 'vitest';

import { AuditRepository } from './audit.repository.js';

describe('AuditRepository', () => {
  it('appends and returns an audit log entry', async () => {
    const createdAt = new Date('2026-09-24T08:00:00.000Z');

    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      actorType: 'user',
      actorId: 'user-123',
      scopeType: 'platform',
      scopeId: null,
      action: 'auth.login.succeeded',
      targetType: 'session',
      targetId: 'session-123',
      result: 'success' as const,
      requestId: 'request-123',
      metadata: {
        source: 'web',
      },
      createdAt,
    };

    const returning = vi.fn().mockResolvedValue([record]);

    const values = vi.fn().mockReturnValue({
      returning,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        insert,
      },
    };

    const repository = new AuditRepository(databaseService as never);

    const input = {
      actorType: 'user',
      actorId: 'user-123',
      scopeType: 'platform',
      scopeId: null,
      action: 'auth.login.succeeded',
      targetType: 'session',
      targetId: 'session-123',
      result: 'success' as const,
      requestId: 'request-123',
      metadata: {
        source: 'web',
      },
    };

    await expect(repository.append(input)).resolves.toEqual(record);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(input);
    expect(returning).toHaveBeenCalledTimes(1);
  });

  it('fails when PostgreSQL does not return the inserted audit entry', async () => {
    const returning = vi.fn().mockResolvedValue([]);

    const values = vi.fn().mockReturnValue({
      returning,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        insert,
      },
    };

    const repository = new AuditRepository(databaseService as never);

    await expect(
      repository.append({
        actorType: 'system',
        actorId: null,
        scopeType: null,
        scopeId: null,
        action: 'maintenance.completed',
        targetType: null,
        targetId: null,
        result: 'success',
        requestId: null,
        metadata: {},
      }),
    ).rejects.toThrow('Failed to append audit log entry');
  });

  it('lists audit entries with pagination and total count', async () => {
    const createdAt = new Date('2026-09-24T10:00:00.000Z');

    const records = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        actorType: 'user',
        actorId: 'user-1',
        scopeType: 'platform',
        scopeId: null,
        action: 'auth.login.succeeded',
        targetType: 'auth-session',
        targetId: 'session-1',
        result: 'success' as const,
        requestId: 'request-1',
        metadata: {},
        createdAt,
      },
    ];

    const itemsOffset = vi.fn().mockResolvedValue(records);

    const itemsLimit = vi.fn().mockReturnValue({
      offset: itemsOffset,
    });

    const itemsOrderBy = vi.fn().mockReturnValue({
      limit: itemsLimit,
    });

    const itemsWhere = vi.fn().mockReturnValue({
      orderBy: itemsOrderBy,
    });

    const itemsFrom = vi.fn().mockReturnValue({
      where: itemsWhere,
    });

    const countWhere = vi.fn().mockResolvedValue([
      {
        count: 7,
      },
    ]);

    const countFrom = vi.fn().mockReturnValue({
      where: countWhere,
    });

    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: itemsFrom,
      })
      .mockReturnValueOnce({
        from: countFrom,
      });

    const databaseService = {
      db: {
        select,
      },
    };

    const repository = new AuditRepository(databaseService as never);

    await expect(
      repository.list({
        page: 2,
        pageSize: 3,
      }),
    ).resolves.toEqual({
      items: records,
      page: 2,
      pageSize: 3,
      total: 7,
    });

    expect(itemsLimit).toHaveBeenCalledWith(3);
    expect(itemsOffset).toHaveBeenCalledWith(3);
    expect(itemsOrderBy).toHaveBeenCalledTimes(1);
    expect(countWhere).toHaveBeenCalledTimes(1);
  });

  it('applies audit filters to both list and count queries', async () => {
    const itemsOffset = vi.fn().mockResolvedValue([]);

    const itemsLimit = vi.fn().mockReturnValue({
      offset: itemsOffset,
    });

    const itemsOrderBy = vi.fn().mockReturnValue({
      limit: itemsLimit,
    });

    const itemsWhere = vi.fn().mockReturnValue({
      orderBy: itemsOrderBy,
    });

    const itemsFrom = vi.fn().mockReturnValue({
      where: itemsWhere,
    });

    const countWhere = vi.fn().mockResolvedValue([
      {
        count: 0,
      },
    ]);

    const countFrom = vi.fn().mockReturnValue({
      where: countWhere,
    });

    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: itemsFrom,
      })
      .mockReturnValueOnce({
        from: countFrom,
      });

    const databaseService = {
      db: {
        select,
      },
    };

    const repository = new AuditRepository(databaseService as never);

    await repository.list({
      page: 1,
      pageSize: 25,
      action: 'auth.login.failed',
      result: 'failure',
      actorType: 'anonymous',
      actorId: 'actor-1',
      scopeType: 'platform',
      scopeId: '11111111-1111-4111-8111-111111111111',
      targetType: 'auth-session',
      targetId: 'session-1',
      requestId: 'request-123',
      createdFrom: new Date('2026-09-01T00:00:00.000Z'),
      createdTo: new Date('2026-09-30T23:59:59.999Z'),
    });

    expect(itemsWhere).toHaveBeenCalledTimes(1);
    expect(countWhere).toHaveBeenCalledTimes(1);

    const itemsCondition = itemsWhere.mock.calls[0]?.[0];

    const countCondition = countWhere.mock.calls[0]?.[0];

    expect(itemsCondition).toBeDefined();
    expect(countCondition).toBeDefined();

    expect(countCondition).toBe(itemsCondition);
  });

  it('supports listing without filters', async () => {
    const itemsOffset = vi.fn().mockResolvedValue([]);

    const itemsLimit = vi.fn().mockReturnValue({
      offset: itemsOffset,
    });

    const itemsOrderBy = vi.fn().mockReturnValue({
      limit: itemsLimit,
    });

    const itemsWhere = vi.fn().mockReturnValue({
      orderBy: itemsOrderBy,
    });

    const itemsFrom = vi.fn().mockReturnValue({
      where: itemsWhere,
    });

    const countWhere = vi.fn().mockResolvedValue([
      {
        count: 0,
      },
    ]);

    const countFrom = vi.fn().mockReturnValue({
      where: countWhere,
    });

    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: itemsFrom,
      })
      .mockReturnValueOnce({
        from: countFrom,
      });

    const databaseService = {
      db: {
        select,
      },
    };

    const repository = new AuditRepository(databaseService as never);

    await repository.list({
      page: 1,
      pageSize: 25,
    });

    expect(itemsWhere).toHaveBeenCalledWith(undefined);
    expect(countWhere).toHaveBeenCalledWith(undefined);
  });
});
