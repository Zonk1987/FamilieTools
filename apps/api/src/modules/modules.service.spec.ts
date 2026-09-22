import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ModulesService } from './modules.service.js';

function createModule(overrides = {}) {
  return {
    id: 'module-row-1',
    moduleId: 'org.familietools.calendar',
    version: '1.0.0',
    name: 'Calendar',
    description: null,
    publisher: 'FamilieTools',
    installationPath: '/modules/org.familietools.calendar/1.0.0',
    packageSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    installSource: 'local',
    manifest: {
      manifestVersion: 1,
    },
    isEnabled: true,
    installedAt: new Date(),
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
    findByModuleIdAndVersion: vi.fn(),
    findByModuleId: vi.fn(),
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
  };
}

describe('ModulesService', () => {
  it('creates an installed module registry entry', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByModuleIdAndVersion.mockResolvedValue(null);

    const createdModule = createModule();

    dependencies.modulesRepository.create.mockResolvedValue(createdModule);

    const result = await dependencies.service.createModule({
      moduleId: ' org.familietools.calendar ',
      version: ' 1.0.0 ',
      name: ' Calendar ',
      description: ' Shared calendar ',
      publisher: ' FamilieTools ',
      installationPath: ' /modules/org.familietools.calendar/1.0.0 ',
      packageSha256: ' 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef ',
      manifest: {
        manifestVersion: 1,
      },
    });

    expect(dependencies.modulesRepository.findByModuleIdAndVersion).toHaveBeenCalledWith(
      'org.familietools.calendar',
      '1.0.0',
      dependencies.tx,
    );

    expect(dependencies.modulesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'org.familietools.calendar',
        version: '1.0.0',
        name: 'Calendar',
        description: 'Shared calendar',
        publisher: 'FamilieTools',
        installationPath: '/modules/org.familietools.calendar/1.0.0',
        packageSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        installSource: 'local',
        isEnabled: true,
      }),
      dependencies.tx,
    );

    expect(result).toEqual(createdModule);
  });

  it('rejects a duplicate module version', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByModuleIdAndVersion.mockResolvedValue(createModule());

    await expect(
      dependencies.service.createModule({
        moduleId: 'org.familietools.calendar',
        version: '1.0.0',
        name: 'Calendar',
        publisher: 'FamilieTools',
        installationPath: '/modules/org.familietools.calendar/1.0.0',
        packageSha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        manifest: {
          manifestVersion: 1,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.modulesRepository.create).not.toHaveBeenCalled();
  });

  it('allows disabling an installed module', async () => {
    const dependencies = createDependencies();

    const module = createModule();

    dependencies.modulesRepository.findById.mockResolvedValue(module);

    dependencies.modulesRepository.update.mockResolvedValue({
      ...module,
      isEnabled: false,
    });

    const result = await dependencies.service.setModuleEnabled('module-row-1', false);

    expect(dependencies.modulesRepository.update).toHaveBeenCalledWith(
      'module-row-1',
      {
        isEnabled: false,
      },
      dependencies.tx,
    );

    expect(result.isEnabled).toBe(false);
  });

  it('lists all installed versions for a module ID', async () => {
    const dependencies = createDependencies();

    const modules = [
      createModule(),
      createModule({
        id: 'module-row-2',
        version: '1.1.0',
      }),
    ];

    dependencies.modulesRepository.findByModuleId.mockResolvedValue(modules);

    const result = await dependencies.service.getModuleVersions('org.familietools.calendar');

    expect(dependencies.modulesRepository.findByModuleId).toHaveBeenCalledWith(
      'org.familietools.calendar',
    );

    expect(result).toEqual(modules);
  });

  it('returns a specific installed module version', async () => {
    const dependencies = createDependencies();

    const module = createModule();

    dependencies.modulesRepository.findByModuleIdAndVersion.mockResolvedValue(module);

    const result = await dependencies.service.getModuleByVersion(
      'org.familietools.calendar',
      '1.0.0',
    );

    expect(result).toEqual(module);
  });

  it('throws when a module version does not exist', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findByModuleIdAndVersion.mockResolvedValue(null);

    await expect(
      dependencies.service.getModuleByVersion('org.familietools.calendar', '9.9.9'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an installed module registry entry', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(createModule());

    dependencies.modulesRepository.delete.mockResolvedValue(true);

    await expect(dependencies.service.deleteModule('module-row-1')).resolves.toBeUndefined();

    expect(dependencies.modulesRepository.delete).toHaveBeenCalledWith(
      'module-row-1',
      dependencies.tx,
    );
  });

  it('throws when requesting an unknown registry entry', async () => {
    const dependencies = createDependencies();

    dependencies.modulesRepository.findById.mockResolvedValue(null);

    await expect(dependencies.service.getModuleById('missing-module')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
