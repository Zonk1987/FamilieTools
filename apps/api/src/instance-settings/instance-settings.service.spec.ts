import { describe, expect, it, vi } from 'vitest';

import { InstanceSettingsService } from './instance-settings.service.js';

function createSelectMock(results: unknown[][]) {
  const limit = vi.fn();

  for (const result of results) {
    limit.mockResolvedValueOnce(result);
  }

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

describe('InstanceSettingsService', () => {
  it('returns a setting value when it exists', async () => {
    const selectMock = createSelectMock([
      [
        {
          key: 'instance.name',
          value: 'FamilieTools',
        },
      ],
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new InstanceSettingsService(databaseService as never);

    await expect(service.get('instance.name')).resolves.toBe('FamilieTools');
  });

  it('returns null when a setting does not exist', async () => {
    const selectMock = createSelectMock([[]]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new InstanceSettingsService(databaseService as never);

    await expect(service.get('instance.name')).resolves.toBeNull();
  });

  it('upserts a setting value', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

    const values = vi.fn().mockReturnValue({
      onConflictDoUpdate,
    });

    const insert = vi.fn().mockReturnValue({
      values,
    });

    const databaseService = {
      db: {
        insert,
      },
    };

    const service = new InstanceSettingsService(databaseService as never);

    await service.set('instance.name', 'FamilieTools');

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'instance.name',
        value: 'FamilieTools',
      }),
    );

    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it('returns multiple requested settings', async () => {
    const selectMock = createSelectMock([
      [
        {
          key: 'instance.name',
          value: 'FamilieTools',
        },
      ],
      [
        {
          key: 'instance.defaultLanguage',
          value: 'de',
        },
      ],
    ]);

    const databaseService = {
      db: {
        select: selectMock.select,
      },
    };

    const service = new InstanceSettingsService(databaseService as never);

    const result = await service.getMany(['instance.name', 'instance.defaultLanguage']);

    expect(result['instance.name']).toBe('FamilieTools');
    expect(result['instance.defaultLanguage']).toBe('de');
  });
});
