import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SYSTEM_THEME_SLUG, ThemesSeed } from './themes.seed.js';

describe('ThemesSeed', () => {
  it('creates the default system theme', async () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);

    const values = vi.fn().mockReturnValue({
      onConflictDoNothing,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        insert,
      },
    };

    const seed = new ThemesSeed(databaseService as never);

    await seed.seed();

    expect(insert).toHaveBeenCalledOnce();

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'FamilieTools Light',
        slug: DEFAULT_SYSTEM_THEME_SLUG,
        description: 'Built-in default theme for FamilieTools.',
        isEnabled: true,
        isDefault: true,
        isSystem: true,
      }),
    );

    expect(onConflictDoNothing).toHaveBeenCalledOnce();
  });

  it('uses an idempotent conflict-safe insert', async () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);

    const values = vi.fn().mockReturnValue({
      onConflictDoNothing,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        insert,
      },
    };

    const seed = new ThemesSeed(databaseService as never);

    await expect(seed.seed()).resolves.toBeUndefined();

    expect(onConflictDoNothing).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.anything(),
      }),
    );
  });
});
