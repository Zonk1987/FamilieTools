import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { UserPreferencesService } from './user-preferences.service.js';

function createTheme(overrides = {}) {
  return {
    id: 'theme-1',
    name: 'FamilieTools Light',
    slug: 'familietools-light',
    description: null,
    tokens: {},
    isEnabled: true,
    isDefault: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDependencies() {
  const tx = {
    id: 'transaction',
  };

  const userPreferencesRepository = {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
  };

  const themesRepository = {
    findById: vi.fn(),
    findDefault: vi.fn(),
  };

  const usersService = {
    findUserById: vi.fn().mockResolvedValue({
      id: 'user-1',
      displayName: 'Sebastian',
    }),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    db: {
      id: 'database',
    },
    transaction,
  };

  const service = new UserPreferencesService(
    userPreferencesRepository as never,
    themesRepository as never,
    usersService as never,
    databaseService as never,
  );

  return {
    service,
    tx,
    databaseService,
    userPreferencesRepository,
    themesRepository,
    usersService,
  };
}

describe('UserPreferencesService', () => {
  it('uses the default theme when the user has no preferences', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue(null);

    const defaultTheme = createTheme();

    dependencies.themesRepository.findDefault.mockResolvedValue(defaultTheme);

    const result = await dependencies.service.getResolvedPreferences('user-1');

    expect(result).toEqual({
      userId: 'user-1',
      theme: defaultTheme,
      colorScheme: 'system',
      density: 'comfortable',
      reducedMotion: false,
    });
  });

  it('uses the selected enabled theme', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue({
      userId: 'user-1',
      themeId: 'theme-2',
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    const selectedTheme = createTheme({
      id: 'theme-2',
      slug: 'soft-family',
      isDefault: false,
    });

    dependencies.themesRepository.findById.mockResolvedValue(selectedTheme);

    const result = await dependencies.service.getResolvedPreferences('user-1');

    expect(result).toEqual({
      userId: 'user-1',
      theme: selectedTheme,
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    expect(dependencies.themesRepository.findDefault).not.toHaveBeenCalled();
  });

  it('falls back to the default theme when the selected theme is disabled', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue({
      userId: 'user-1',
      themeId: 'theme-2',
      colorScheme: 'system',
      density: 'comfortable',
      reducedMotion: false,
    });

    dependencies.themesRepository.findById.mockResolvedValue(
      createTheme({
        id: 'theme-2',
        isEnabled: false,
        isDefault: false,
      }),
    );

    const defaultTheme = createTheme();

    dependencies.themesRepository.findDefault.mockResolvedValue(defaultTheme);

    const result = await dependencies.service.getResolvedPreferences('user-1');

    expect(result.theme).toEqual(defaultTheme);
  });

  it('rejects an unknown user', async () => {
    const dependencies = createDependencies();

    dependencies.usersService.findUserById.mockResolvedValue(null);

    await expect(
      dependencies.service.getResolvedPreferences('missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(dependencies.userPreferencesRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('updates preferences inside one transaction', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue(null);

    const selectedTheme = createTheme({
      id: 'theme-2',
      slug: 'soft-family',
      isDefault: false,
    });

    dependencies.themesRepository.findById.mockResolvedValue(selectedTheme);

    dependencies.userPreferencesRepository.upsert.mockResolvedValue({
      userId: 'user-1',
      themeId: 'theme-2',
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    const result = await dependencies.service.updatePreferences('user-1', {
      themeId: 'theme-2',
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    expect(dependencies.databaseService.transaction).toHaveBeenCalledTimes(1);

    expect(dependencies.usersService.findUserById).toHaveBeenCalledWith('user-1', dependencies.tx);

    expect(dependencies.userPreferencesRepository.upsert).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        themeId: 'theme-2',
        colorScheme: 'dark',
        density: 'compact',
        reducedMotion: true,
      },
      dependencies.tx,
    );

    expect(result.theme).toEqual(selectedTheme);
  });

  it('rejects selecting a disabled theme', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue(null);

    dependencies.themesRepository.findById.mockResolvedValue(
      createTheme({
        id: 'theme-2',
        isEnabled: false,
        isDefault: false,
      }),
    );

    await expect(
      dependencies.service.updatePreferences('user-1', {
        themeId: 'theme-2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.userPreferencesRepository.upsert).not.toHaveBeenCalled();
  });

  it('rejects selecting an unknown theme', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue(null);

    dependencies.themesRepository.findById.mockResolvedValue(null);

    await expect(
      dependencies.service.updatePreferences('user-1', {
        themeId: 'missing-theme',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(dependencies.userPreferencesRepository.upsert).not.toHaveBeenCalled();
  });

  it('allows clearing an explicitly selected theme', async () => {
    const dependencies = createDependencies();

    dependencies.userPreferencesRepository.findByUserId.mockResolvedValue({
      userId: 'user-1',
      themeId: 'theme-2',
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    dependencies.userPreferencesRepository.upsert.mockResolvedValue({
      userId: 'user-1',
      themeId: null,
      colorScheme: 'dark',
      density: 'compact',
      reducedMotion: true,
    });

    const defaultTheme = createTheme();

    dependencies.themesRepository.findDefault.mockResolvedValue(defaultTheme);

    const result = await dependencies.service.updatePreferences('user-1', {
      themeId: null,
    });

    expect(dependencies.userPreferencesRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        themeId: null,
      }),
      dependencies.tx,
    );

    expect(result.theme).toEqual(defaultTheme);
  });
});
