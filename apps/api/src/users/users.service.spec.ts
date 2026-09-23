import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { User } from './users.repository.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('normalizes login name and display name before creating a user', async () => {
    const createdUser: User = {
      id: '11111111-1111-1111-1111-111111111111',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const create = vi.fn().mockResolvedValue(createdUser);
    const findById = vi.fn();
    const findByLoginName = vi.fn().mockResolvedValue(null);

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn().mockResolvedValue('scrypt$salt$hash'),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    const result = await usersService.createUser({
      loginName: '  Sebastian  ',
      displayName: '  Sebastian  ',
      password: 'very-secure-password',
    });

    expect(findByLoginName).toHaveBeenCalledWith('sebastian', undefined);

    expect(passwordService.hash).toHaveBeenCalledWith('very-secure-password');

    expect(create).toHaveBeenCalledWith(
      {
        loginName: 'sebastian',
        displayName: 'Sebastian',
        passwordHash: 'scrypt$salt$hash',
      },
      undefined,
    );

    expect(result).toEqual(createdUser);
  });

  it('rejects an empty display name', async () => {
    const create = vi.fn();
    const findById = vi.fn();
    const findByLoginName = vi.fn();

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn(),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: 'sebastian',
        displayName: '   ',
        password: 'very-secure-password',
      }),
    ).rejects.toThrow('Display name must not be empty');

    expect(create).not.toHaveBeenCalled();
    expect(passwordService.hash).not.toHaveBeenCalled();
  });

  it('rejects an empty login name', async () => {
    const create = vi.fn();
    const findById = vi.fn();
    const findByLoginName = vi.fn();

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn(),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: '   ',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      }),
    ).rejects.toThrow('Login name must not be empty');

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than 12 characters', async () => {
    const create = vi.fn();
    const findById = vi.fn();
    const findByLoginName = vi.fn();

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn(),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: 'sebastian',
        displayName: 'Sebastian',
        password: 'short',
      }),
    ).rejects.toThrow('Password must contain at least 12 characters');

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects duplicate login names', async () => {
    const create = vi.fn();
    const findById = vi.fn();

    const findByLoginName = vi.fn().mockResolvedValue({
      id: 'existing-user',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      passwordHash: 'scrypt$salt$hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn(),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: 'Sebastian',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(create).not.toHaveBeenCalled();
    expect(passwordService.hash).not.toHaveBeenCalled();
  });

  it('maps a PostgreSQL unique violation during user creation to ConflictException', async () => {
    const create = vi.fn().mockRejectedValue({
      code: '23505',
    });

    const findById = vi.fn();

    const findByLoginName = vi.fn().mockResolvedValue(null);

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn().mockResolvedValue('scrypt$salt$hash'),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: 'Sebastian',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(findByLoginName).toHaveBeenCalledWith('sebastian', undefined);

    expect(passwordService.hash).toHaveBeenCalledWith('very-secure-password');

    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rethrows non-unique database errors during user creation', async () => {
    const databaseError = {
      code: '08006',
      message: 'connection failure',
    };

    const create = vi.fn().mockRejectedValue(databaseError);

    const findById = vi.fn();

    const findByLoginName = vi.fn().mockResolvedValue(null);

    const usersRepository = {
      create,
      findById,
      findByLoginName,
    } as unknown as UsersRepository;

    const passwordService = {
      hash: vi.fn().mockResolvedValue('scrypt$salt$hash'),
    };

    const usersService = new UsersService(usersRepository, passwordService as never);

    await expect(
      usersService.createUser({
        loginName: 'sebastian',
        displayName: 'Sebastian',
        password: 'very-secure-password',
      }),
    ).rejects.toBe(databaseError);

    expect(findByLoginName).toHaveBeenCalledWith('sebastian', undefined);

    expect(passwordService.hash).toHaveBeenCalledWith('very-secure-password');

    expect(create).toHaveBeenCalledTimes(1);
  });
});
