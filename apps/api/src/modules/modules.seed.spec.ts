import { describe, expect, it, vi } from 'vitest';

import { ModulesSeed } from './modules.seed.js';

describe('ModulesSeed', () => {
  it('does not create modules that already exist', async () => {
    const modulesService = {
      getModuleByKey: vi.fn().mockResolvedValue({
        id: 'module-1',
      }),
      createModule: vi.fn(),
    };

    const seed = new ModulesSeed(modulesService as never);

    await seed.seed();

    expect(modulesService.getModuleByKey).toHaveBeenCalledTimes(4);

    expect(modulesService.createModule).not.toHaveBeenCalled();
  });

  it('creates missing built-in modules', async () => {
    const modulesService = {
      getModuleByKey: vi.fn().mockRejectedValue(new Error('Module not found')),
      createModule: vi.fn().mockResolvedValue(undefined),
    };

    const seed = new ModulesSeed(modulesService as never);

    await seed.seed();

    expect(modulesService.createModule).toHaveBeenCalledTimes(4);

    expect(modulesService.createModule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'calendar',
        isSystem: true,
      }),
    );

    expect(modulesService.createModule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'shopping',
        isSystem: true,
      }),
    );

    expect(modulesService.createModule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'baby_tracking',
        defaultEnabledForFamilies: false,
      }),
    );

    expect(modulesService.createModule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'photos',
        defaultEnabledForFamilies: false,
      }),
    );
  });

  it('creates only modules that are missing', async () => {
    const modulesService = {
      getModuleByKey: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'calendar',
        })
        .mockRejectedValueOnce(new Error('Module not found'))
        .mockResolvedValueOnce({
          id: 'baby-tracking',
        })
        .mockResolvedValueOnce({
          id: 'photos',
        }),
      createModule: vi.fn().mockResolvedValue(undefined),
    };

    const seed = new ModulesSeed(modulesService as never);

    await seed.seed();

    expect(modulesService.createModule).toHaveBeenCalledTimes(1);

    expect(modulesService.createModule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'shopping',
      }),
    );
  });
});
