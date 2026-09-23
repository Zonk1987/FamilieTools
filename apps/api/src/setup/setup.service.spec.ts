import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { SetupService } from './setup.service.js';

const setupInput = {
  owner: {
    loginName: 'sebastian',
    displayName: 'Sebastian',
    password: 'very-secure-password',
  },
  instance: {
    name: 'FamilieTools',
    defaultLanguage: 'de',
    defaultTimezone: 'Europe/Berlin',
  },
  family: {
    name: 'Familie Haupt',
  },
};

function createDependencies() {
  const tx = {
    id: 'test-transaction',
  };

  const platformStateService = {
    claimSetup: vi.fn().mockResolvedValue(true),
    setState: vi.fn().mockResolvedValue(undefined),
  };

  const instanceSettingsService = {
    set: vi.fn().mockResolvedValue(undefined),
  };

  const usersService = {
    createUser: vi.fn().mockResolvedValue({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
    }),
  };

  const familiesService = {
    createFamily: vi.fn().mockResolvedValue({
      id: 'family-1',
      name: 'Familie Haupt',
    }),
  };

  const familyMembershipsService = {
    addUserToFamily: vi.fn().mockResolvedValue({
      id: 'membership-1',
      familyId: 'family-1',
      userId: 'user-1',
    }),
  };

  const platformAuthService = {
    assignPlatformOwner: vi.fn().mockResolvedValue(undefined),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    transaction,
  };

  const service = new SetupService(
    platformStateService as never,
    instanceSettingsService as never,
    usersService as never,
    familiesService as never,
    familyMembershipsService as never,
    databaseService as never,
    platformAuthService as never,
  );

  return {
    service,
    tx,
    databaseService,
    platformStateService,
    instanceSettingsService,
    usersService,
    familiesService,
    familyMembershipsService,
    platformAuthService,
  };
}

describe('SetupService', () => {
  it('initializes the platform inside one transaction after atomically claiming setup', async () => {
    const dependencies = createDependencies();

    const result = await dependencies.service.initialize(setupInput);

    expect(dependencies.databaseService.transaction).toHaveBeenCalledTimes(1);

    expect(dependencies.platformStateService.claimSetup).toHaveBeenCalledWith(dependencies.tx);

    expect(dependencies.usersService.createUser).toHaveBeenCalledWith(
      {
        loginName: 'sebastian',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      },
      dependencies.tx,
    );

    expect(dependencies.familiesService.createFamily).toHaveBeenCalledWith(
      'Familie Haupt',
      dependencies.tx,
    );

    expect(dependencies.familyMembershipsService.addUserToFamily).toHaveBeenCalledWith(
      'family-1',
      'user-1',
      dependencies.tx,
    );

    expect(dependencies.platformAuthService.assignPlatformOwner).toHaveBeenCalledWith(
      'user-1',
      dependencies.tx,
    );

    expect(dependencies.instanceSettingsService.set).toHaveBeenCalledWith(
      'instance.name',
      'FamilieTools',
      dependencies.tx,
    );

    expect(dependencies.instanceSettingsService.set).toHaveBeenCalledWith(
      'instance.defaultLanguage',
      'de',
      dependencies.tx,
    );

    expect(dependencies.instanceSettingsService.set).toHaveBeenCalledWith(
      'instance.defaultTimezone',
      'Europe/Berlin',
      dependencies.tx,
    );

    expect(dependencies.platformStateService.setState).toHaveBeenCalledTimes(1);

    expect(dependencies.platformStateService.setState).toHaveBeenCalledWith(
      'ready',
      dependencies.tx,
    );

    expect(result).toEqual({
      status: 'ready',
      user: {
        id: 'user-1',
        loginName: 'sebastian',
        displayName: 'Sebastian',
      },
      family: {
        id: 'family-1',
        name: 'Familie Haupt',
      },
    });
  });

  it('rejects setup when another request already claimed it', async () => {
    const dependencies = createDependencies();

    dependencies.platformStateService.claimSetup.mockResolvedValueOnce(false);

    await expect(dependencies.service.initialize(setupInput)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.platformStateService.claimSetup).toHaveBeenCalledWith(dependencies.tx);

    expect(dependencies.usersService.createUser).not.toHaveBeenCalled();

    expect(dependencies.familiesService.createFamily).not.toHaveBeenCalled();

    expect(dependencies.familyMembershipsService.addUserToFamily).not.toHaveBeenCalled();

    expect(dependencies.platformAuthService.assignPlatformOwner).not.toHaveBeenCalled();

    expect(dependencies.instanceSettingsService.set).not.toHaveBeenCalled();

    expect(dependencies.platformStateService.setState).not.toHaveBeenCalled();
  });

  it('stops setup when a transactional operation fails', async () => {
    const dependencies = createDependencies();

    dependencies.familiesService.createFamily.mockRejectedValueOnce(
      new Error('Simulated family creation failure'),
    );

    await expect(dependencies.service.initialize(setupInput)).rejects.toThrow(
      'Simulated family creation failure',
    );

    expect(dependencies.platformStateService.claimSetup).toHaveBeenCalledWith(dependencies.tx);

    expect(dependencies.usersService.createUser).toHaveBeenCalledWith(
      {
        loginName: 'sebastian',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      },
      dependencies.tx,
    );

    expect(dependencies.familiesService.createFamily).toHaveBeenCalledWith(
      'Familie Haupt',
      dependencies.tx,
    );

    expect(dependencies.familyMembershipsService.addUserToFamily).not.toHaveBeenCalled();

    expect(dependencies.platformAuthService.assignPlatformOwner).not.toHaveBeenCalled();

    expect(dependencies.instanceSettingsService.set).not.toHaveBeenCalled();

    expect(dependencies.platformStateService.setState).not.toHaveBeenCalledWith(
      'ready',
      dependencies.tx,
    );
  });
});
