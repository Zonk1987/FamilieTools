import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SYSTEM_THEME_SLUG, ThemesSeed } from './themes.seed.js';

describe('ThemesSeed', () => {
  it('does not create the system theme when it already exists', async () => {
    const themesService = {
      getThemeBySlug: vi.fn().mockResolvedValue({
        id: 'theme-1',
        slug: DEFAULT_SYSTEM_THEME_SLUG,
      }),
      createTheme: vi.fn(),
    };

    const seed = new ThemesSeed(themesService as never);

    await seed.seed();

    expect(themesService.getThemeBySlug).toHaveBeenCalledWith(DEFAULT_SYSTEM_THEME_SLUG);

    expect(themesService.createTheme).not.toHaveBeenCalled();
  });

  it('creates the system theme when it does not exist', async () => {
    const themesService = {
      getThemeBySlug: vi.fn().mockRejectedValue(new Error('Theme not found')),
      createTheme: vi.fn().mockResolvedValue(undefined),
    };

    const seed = new ThemesSeed(themesService as never);

    await seed.seed();

    expect(themesService.createTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'FamilieTools Light',
        slug: DEFAULT_SYSTEM_THEME_SLUG,
        isEnabled: true,
        isDefault: true,
        isSystem: true,
      }),
    );
  });
});
