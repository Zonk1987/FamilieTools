import { describe, expect, it, vi } from 'vitest';

import { PlatformAuthService } from './platform-auth.service.js';

function createSimpleSelectMock(results: unknown[][]) {
  const limit = vi.fn();

  for (const result of results) {
    limit.mockResolvedValueOnce(result);
  }

  const where = vi.fn().mockReturnValue({
    limit,
  });

  const from = vi.fn().mockReturnValue({
    where,
  });

  const select = vi.fn().mockReturnValue({
    from,
  });

  return {
    select,
  };
}

describe('PlatformAuthService', () => {
  it('assigns the platform owner role when no assignment exists', async () => {
    const selectMock = createSimpleSelectMock([
      [
        {
          id: 'role-1',
          key: 'platform_owner',
        },
      ],
      [],
    ]);

    const values = vi.fn().mockResolvedValue(undefined);

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        select: selectMock.select,
        insert,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await service.assignPlatformOwner('user-1');

    expect(values).toHaveBeenCalledWith({
      userId: 'user-1',
      roleId: 'role-1',
    });
  });

  it('does not create a duplicate platform owner assignment', async () => {
    const selectMock = createSimpleSelectMock([
      [
        {
          id: 'role-1',
          key: 'platform_owner',
        },
      ],
      [
        {
          id: 'assignment-1',
          userId: 'user-1',
          roleId: 'role-1',
        },
      ],
    ]);

    const insert = vi.fn();

    const databaseService = {
      db: {
        select: selectMock.select,
        insert,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await service.assignPlatformOwner('user-1');

    expect(insert).not.toHaveBeenCalled();
  });

  it('returns true when the user has the requested platform role', async () => {
    const limit = vi.fn().mockResolvedValue([
      {
        roleId: 'role-1',
      },
    ]);

    const where = vi.fn().mockReturnValue({
      limit,
    });

    const innerJoin = vi.fn().mockReturnValue({
      where,
    });

    const from = vi.fn().mockReturnValue({
      innerJoin,
    });

    const select = vi.fn().mockReturnValue({
      from,
    });

    const databaseService = {
      db: {
        select,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await expect(service.hasPlatformRole('user-1', 'platform_owner')).resolves.toBe(true);
  });

  it('returns false when the user does not have the requested platform role', async () => {
    const limit = vi.fn().mockResolvedValue([]);

    const where = vi.fn().mockReturnValue({
      limit,
    });

    const innerJoin = vi.fn().mockReturnValue({
      where,
    });

    const from = vi.fn().mockReturnValue({
      innerJoin,
    });

    const select = vi.fn().mockReturnValue({
      from,
    });

    const databaseService = {
      db: {
        select,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await expect(service.hasPlatformRole('user-1', 'platform_owner')).resolves.toBe(false);
  });

  it('returns true when the user has the requested capability', async () => {
    const limit = vi.fn().mockResolvedValue([
      {
        capability: 'platform.admin.access',
      },
    ]);

    const where = vi.fn().mockReturnValue({
      limit,
    });

    const secondInnerJoin = vi.fn().mockReturnValue({
      where,
    });

    const firstInnerJoin = vi.fn().mockReturnValue({
      innerJoin: secondInnerJoin,
    });

    const from = vi.fn().mockReturnValue({
      innerJoin: firstInnerJoin,
    });

    const select = vi.fn().mockReturnValue({
      from,
    });

    const databaseService = {
      db: {
        select,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await expect(service.hasCapability('user-1', 'platform.admin.access')).resolves.toBe(true);
  });

  it('returns false when the user does not have the requested capability', async () => {
    const limit = vi.fn().mockResolvedValue([]);

    const where = vi.fn().mockReturnValue({
      limit,
    });

    const secondInnerJoin = vi.fn().mockReturnValue({
      where,
    });

    const firstInnerJoin = vi.fn().mockReturnValue({
      innerJoin: secondInnerJoin,
    });

    const from = vi.fn().mockReturnValue({
      innerJoin: firstInnerJoin,
    });

    const select = vi.fn().mockReturnValue({
      from,
    });

    const databaseService = {
      db: {
        select,
      },
    };

    const service = new PlatformAuthService(databaseService as never);

    await expect(service.hasCapability('user-1', 'platform.admin.access')).resolves.toBe(false);
  });
});
