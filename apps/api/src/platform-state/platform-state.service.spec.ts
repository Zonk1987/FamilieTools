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
    from,
    where,
    limit,
  };
}

function createInsertMock(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);

  const onConflictDoNothing = vi.fn().mockReturnValue({
    returning,
  });

  const values = vi.fn().mockReturnValue({
    onConflictDoNothing,
  });

  const insert = vi.fn().mockReturnValue({
    values,
  });

  return {
    insert,
    values,
    onConflictDoNothing,
    returning,
  };
}

function createUpdateMock(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);

  const where = vi.fn().mockReturnValue({
    returning,
  });

  const set = vi.fn().mockReturnValue({
    where,
  });

  const update = vi.fn().mockReturnValue({
    set,
  });

  return {
    update,
    set,
    where,
    returning,
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

    const insertMock = createInsertMock([
      {
        key: 'instance',
        initializationState: 'uninitialized',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
        insert: insertMock.insert,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.getState()).resolves.toBe('uninitialized');

    expect(insertMock.onConflictDoNothing).toHaveBeenCalledTimes(1);
  });

  it('loads the concurrently created state when initialization insert loses the race', async () => {
    const firstSelect = createSelectMock([]);
    const secondSelect = createSelectMock([
      {
        key: 'instance',
        initializationState: 'uninitialized',
      },
    ]);

    const select = vi
      .fn()
      .mockImplementationOnce(firstSelect.select)
      .mockImplementationOnce(secondSelect.select);

    const insertMock = createInsertMock([]);

    const databaseService = {
      db: {
        select,
        insert: insertMock.insert,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.getState()).resolves.toBe('uninitialized');

    expect(select).toHaveBeenCalledTimes(2);
  });

  it('reports setup as allowed only for uninitialized state', async () => {
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

  it('reports setup as unavailable for initializing state', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'initializing',
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

  it('atomically claims setup from uninitialized state', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'uninitialized',
      },
    ]);

    const updateMock = createUpdateMock([
      {
        key: 'instance',
      },
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
        update: updateMock.update,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.claimSetup()).resolves.toBe(true);

    expect(updateMock.update).toHaveBeenCalledTimes(1);
    expect(updateMock.set).toHaveBeenCalledTimes(1);
    expect(updateMock.where).toHaveBeenCalledTimes(1);
    expect(updateMock.returning).toHaveBeenCalledTimes(1);
  });

  it('fails to claim setup when another request already claimed it', async () => {
    const selectMock = createSelectMock([
      {
        key: 'instance',
        initializationState: 'initializing',
      },
    ]);

    const updateMock = createUpdateMock([]);

    const databaseService = {
      db: {
        select: selectMock.select,
        update: updateMock.update,
      },
    };

    const service = new PlatformStateService(databaseService as never);

    await expect(service.claimSetup()).resolves.toBe(false);
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
