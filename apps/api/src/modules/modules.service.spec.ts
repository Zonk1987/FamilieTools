import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ModulesService } from './modules.service.js';

function createModule(overrides = {}) {
  return {
    id: 'module-1',
    key: 'calendar',
    name: 'Calendar',
    description: null,
    isEnabled: true,
    isSystem: false,
    isRequired: false,
    defaultEnabledForFamilies: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDependencies() {
  const tx = {
    id: 'transaction',
  };

  const modulesRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByKey: vi.fn(),
    findAll: vi.fn(),
    findEnabled: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    transaction,
  };

  const service = new ModulesService(modulesRepository as never, databaseService as never);

  return {
    service,
    tx,
    modulesRepository,
    databaseService,
  };
}

describe('ModulesService', () => {
  it('creates a module with a normalized key', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByKey.mockResolvedValue(null);

    const createdModule = createModule({
      key: 'baby_tracking',
      name: 'Baby Tracking',
    });

    dependencies.modulesRepository.create.mockResolvedValue(createdModule);

    const result = await dependencies.service.createModule({
      key: '  Baby Tracking  ',
      name: '  Baby Tracking  ',
    });

    expect(dependencies.modulesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'baby_tracking',
        name: 'Baby Tracking',
        isEnabled: true,
        isSystem: false,
        isRequired: false,
        defaultEnabledForFamilies: true,
      }),
      dependencies.tx,
    );

    expect(result).toEqual(createdModule);
  });

  it('rejects a duplicate module key', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByKey.mockResolvedValue(createModule());

    await expect(
      dependencies.service.createModule({
        key: 'calendar',
        name: 'Another Calendar',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.modulesRepository.create).not.toHaveBeenCalled();
  });

  it('forces required modules to be enabled', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByKey.mockResolvedValue(null);

    dependencies.modulesRepository.create.mockImplementation(async (data) => ({
      id: 'module-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }));

    await dependencies.service.createModule({
      key: 'core',
      name: 'Core',
      isEnabled: false,
      isRequired: true,
    });

    expect(dependencies.modulesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: true,
        isRequired: true,
      }),
      dependencies.tx,
    );
  });

  it('does not allow disabling a required module', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(
      createModule({
        isRequired: true,
      }),
    );

    await expect(dependencies.service.setModuleEnabled('module-1', false)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.modulesRepository.update).not.toHaveBeenCalled();
  });

  it('allows disabling a non-required module', async () => {
    const dependencies = createDependencies();

    const module = createModule();

    dependencies.modulesRepository.findById.mockResolvedValue(module);

    dependencies.modulesRepository.update.mockResolvedValue({
      ...module,
      isEnabled: false,
    });

    const result = await dependencies.service.setModuleEnabled('module-1', false);

    expect(dependencies.modulesRepository.update).toHaveBeenCalledWith(
      'module-1',
      {
        isEnabled: false,
      },
      dependencies.tx,
    );

    expect(result.isEnabled).toBe(false);
  });

  it('does not allow deleting a system module', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(
      createModule({
        isSystem: true,
      }),
    );

    await expect(dependencies.service.deleteModule('module-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.modulesRepository.delete).not.toHaveBeenCalled();
  });

  it('does not allow deleting a required module', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(
      createModule({
        isRequired: true,
      }),
    );

    await expect(dependencies.service.deleteModule('module-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.modulesRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes a normal module', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(createModule());

    dependencies.modulesRepository.delete.mockResolvedValue(true);

    await expect(dependencies.service.deleteModule('module-1')).resolves.toBeUndefined();

    expect(dependencies.modulesRepository.delete).toHaveBeenCalledWith('module-1', dependencies.tx);
  });

  it('throws when requesting an unknown module', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(null);

    await expect(dependencies.service.getModuleById('missing-module')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
