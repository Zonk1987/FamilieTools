import { describe, expect, it, vi } from 'vitest';

import type { User } from './users.repository.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('trims the display name before creating a user', async () => {
    const createdUser: User = {
      id: '11111111-1111-1111-1111-111111111111',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const create = vi.fn().mockResolvedValue(createdUser);
    const findById = vi.fn();

    const usersRepository = {
      create,
      findById,
    } as unknown as UsersRepository;

    const usersService = new UsersService(usersRepository);

    const result = await usersService.createUser('  Sebastian  ');

    expect(create).toHaveBeenCalledWith({
      displayName: 'Sebastian',
    });

    expect(result).toEqual(createdUser);
  });

  it('rejects an empty display name', async () => {
    const create = vi.fn();
    const findById = vi.fn();

    const usersRepository = {
      create,
      findById,
    } as unknown as UsersRepository;

    const usersService = new UsersService(usersRepository);

    await expect(usersService.createUser('   ')).rejects.toThrow('Display name must not be empty');

    expect(create).not.toHaveBeenCalled();
  });
});
