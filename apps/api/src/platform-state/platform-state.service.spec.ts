import { describe, expect, it, vi } from 'vitest';

import { PlatformStateService } from './platform-state.service.js';

function createSelectMock(result: unknown[]) {
  const limit = vi.fn().mockResolvedValue(result);

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

describe('PlatformStateService', () => {
  it('returns the existing platform state', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'ready',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.getState()).resolves.toBe('ready');
  });

  it('creates an uninitialized state when none exists', async () => {
    const selectMock = createSelectMock([]);

    const returning = vi.fn().mockResolvedValue([
      {
        key: 'instance',
        initializationState: 'uninitialized',
      },
    ]);

    const values = vi.fn().mockReturnValue({
      returning,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        select: selectMock.select,
        insert,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.getState()).resolves.toBe('uninitialized');
  });

  it('reports setup as allowed for uninitialized state', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'uninitialized',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.isSetupAllowed()).resolves.toBe(true);
  });

  it('reports setup as unavailable for ready state', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'ready',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.isSetupAllowed()).resolves.toBe(false);
  });

  it('reports ready state as initialized', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'ready',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.isInitialized()).resolves.toBe(true);
  });
});
