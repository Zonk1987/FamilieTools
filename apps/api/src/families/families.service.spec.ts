import { describe, expect, it, vi } from 'vitest';

import type { Family } from './families.repository.js';
import { FamiliesRepository } from './families.repository.js';
import { FamiliesService } from './families.service.js';

describe('FamiliesService', () => {
  it('trims the family name before creating a family', async () => {
    const createdFamily: Family = {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Haupt',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const create = vi.fn().mockResolvedValue(createdFamily);
    const findById = vi.fn();

    const familiesRepository = {
      create,
      findById,
    } as unknown as FamiliesRepository;

    const familiesService = new FamiliesService(familiesRepository);

    const result = await familiesService.createFamily('  Haupt  ');

    expect(create).toHaveBeenCalledWith({
      name: 'Haupt',
    });

    expect(result).toEqual(createdFamily);
  });

  it('rejects an empty family name', async () => {
    const create = vi.fn();
    const findById = vi.fn();

    const familiesRepository = {
      create,
      findById,
    } as unknown as FamiliesRepository;

    const familiesService = new FamiliesService(familiesRepository);

    await expect(familiesService.createFamily('   ')).rejects.toThrow(
      'Family name must not be empty',
    );

    expect(create).not.toHaveBeenCalled();
  });
});
