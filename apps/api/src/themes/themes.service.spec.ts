import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ThemesService } from './themes.service.js';

const themeTokens = {
  colors: {
    background: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#f5f5f5',
    text: '#111111',
    textMuted: '#666666',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#e5e7eb',
    secondaryForeground: '#111111',
    accent: '#8b5cf6',
    accentForeground: '#ffffff',
    border: '#d1d5db',
    danger: '#dc2626',
    dangerForeground: '#ffffff',
    success: '#16a34a',
    successForeground: '#ffffff',
    warning: '#d97706',
    warningForeground: '#ffffff',
  },
  typography: {
    fontFamily: 'Inter',
  },
  radius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  shadow: {
    small: '0 1px 2px rgb(0 0 0 / 0.05)',
    medium: '0 4px 6px rgb(0 0 0 / 0.10)',
    large: '0 10px 15px rgb(0 0 0 / 0.15)',
  },
};

function createTheme(overrides = {}) {
  return {
    id: 'theme-1',
    name: 'FamilieTools Light',
    slug: 'familietools-light',
    description: null,
    tokens: themeTokens,
    isEnabled: true,
    isDefault: false,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDependencies() {
  const tx = {
    id: 'transaction',
  };

  const themesRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findDefault: vi.fn(),
    findAll: vi.fn(),
    findEnabled: vi.fn(),
    update: vi.fn(),
    clearDefault: vi.fn(),
    delete: vi.fn(),
  };

  const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );

  const databaseService = {
    transaction,
  };

  const service = new ThemesService(themesRepository as never, databaseService as never);

  return {
    service,
    tx,
    themesRepository,
    databaseService,
  };
}

describe('ThemesService', () => {
  it('creates the first theme as enabled default theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findBySlug.mockResolvedValue(null);

    dependencies.themesRepository.findDefault.mockResolvedValue(null);

    const createdTheme = createTheme({
      isDefault: true,
    });

    dependencies.themesRepository.create.mockResolvedValue(createdTheme);

    const result = await dependencies.service.createTheme({
      name: '  FamilieTools Light  ',
      slug: '  FamilieTools Light  ',
      tokens: themeTokens,
    });

    expect(dependencies.themesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'FamilieTools Light',
        slug: 'familietools-light',
        isEnabled: true,
        isDefault: true,
        isSystem: false,
      }),
      dependencies.tx,
    );

    expect(result).toEqual(createdTheme);
  });

  it('rejects a duplicate theme slug', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findBySlug.mockResolvedValue(createTheme());

    await expect(
      dependencies.service.createTheme({
        name: 'Another Theme',
        slug: 'FamilieTools Light',
        tokens: themeTokens,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(dependencies.themesRepository.create).not.toHaveBeenCalled();
  });

  it('makes an explicitly selected theme the only default', async () => {
    const dependencies = createDependencies();

    const theme = createTheme({
      id: 'theme-2',
      slug: 'soft-family',
      isEnabled: false,
      isDefault: false,
    });

    dependencies.themesRepository.findById.mockResolvedValue(theme);

    dependencies.themesRepository.update.mockResolvedValue({
      ...theme,
      isEnabled: true,
      isDefault: true,
    });

    const result = await dependencies.service.setDefaultTheme('theme-2');

    expect(dependencies.themesRepository.clearDefault).toHaveBeenCalledWith(dependencies.tx);

    expect(dependencies.themesRepository.update).toHaveBeenCalledWith(
      'theme-2',
      {
        isDefault: true,
        isEnabled: true,
      },
      dependencies.tx,
    );

    expect(result.isDefault).toBe(true);
    expect(result.isEnabled).toBe(true);
  });

  it('does not allow disabling the default theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findById.mockResolvedValue(
      createTheme({
        isDefault: true,
      }),
    );

    await expect(dependencies.service.setThemeEnabled('theme-1', false)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.themesRepository.update).not.toHaveBeenCalled();
  });

  it('does not allow deleting a system theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findById.mockResolvedValue(
      createTheme({
        isSystem: true,
      }),
    );

    await expect(dependencies.service.deleteTheme('theme-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.themesRepository.delete).not.toHaveBeenCalled();
  });

  it('does not allow deleting the default theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findById.mockResolvedValue(
      createTheme({
        isDefault: true,
      }),
    );

    await expect(dependencies.service.deleteTheme('theme-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(dependencies.themesRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes a normal non-default theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findById.mockResolvedValue(createTheme());

    dependencies.themesRepository.delete.mockResolvedValue(true);

    await expect(dependencies.service.deleteTheme('theme-1')).resolves.toBeUndefined();

    expect(dependencies.themesRepository.delete).toHaveBeenCalledWith('theme-1', dependencies.tx);
  });

  it('throws when requesting an unknown theme', async () => {
    const dependencies = createDependencies();

    dependencies.themesRepository.findById.mockResolvedValue(null);

    await expect(dependencies.service.getThemeById('missing-theme')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
