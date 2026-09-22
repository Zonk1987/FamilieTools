import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';

function createDependencies() {
  const usersRepository = {
    findByLoginName: vi.fn(),
  };

  const passwordService = {
    verify: vi.fn(),
  };

  const authSessionsRepository = {
    create: vi.fn(),
    findValidByTokenHash: vi.fn(),
    touch: vi.fn(),
    deleteByTokenHash: vi.fn(),
  };

  const service = new AuthService(
    usersRepository as never,
    passwordService as never,
    authSessionsRepository as never,
  );

  return {
    service,
    usersRepository,
    passwordService,
    authSessionsRepository,
  };
}

describe('AuthService', () => {
  it('creates a session for valid credentials', async () => {
    const dependencies = createDependencies();

    dependencies.usersRepository.findByLoginName.mockResolvedValue({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      passwordHash: 'stored-hash',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    dependencies.passwordService.verify.mockResolvedValue(true);

    dependencies.authSessionsRepository.create.mockResolvedValue({
      id: 'session-1',
    });

    const result = await dependencies.service.login(' Sebastian ', 'very-secure-password');

    expect(dependencies.usersRepository.findByLoginName).toHaveBeenCalledWith('sebastian');

    expect(dependencies.passwordService.verify).toHaveBeenCalledWith(
      'very-secure-password',
      'stored-hash',
    );

    expect(dependencies.authSessionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );

    expect(result.token).toEqual(expect.any(String));

    expect(result.user).toEqual({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('rejects an unknown login name', async () => {
    const dependencies = createDependencies();

    dependencies.usersRepository.findByLoginName.mockResolvedValue(null);

    await expect(
      dependencies.service.login('unknown', 'very-secure-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(dependencies.passwordService.verify).not.toHaveBeenCalled();

    expect(dependencies.authSessionsRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    const dependencies = createDependencies();

    dependencies.usersRepository.findByLoginName.mockResolvedValue({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      passwordHash: 'stored-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    dependencies.passwordService.verify.mockResolvedValue(false);

    await expect(dependencies.service.login('sebastian', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(dependencies.authSessionsRepository.create).not.toHaveBeenCalled();
  });

  it('returns a user for a valid session token', async () => {
    const dependencies = createDependencies();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const result = await dependencies.service.authenticate('session-token');

    expect(dependencies.authSessionsRepository.findValidByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
    );

    expect(dependencies.authSessionsRepository.touch).toHaveBeenCalledWith('session-1');

    expect(result).toEqual({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('returns null for an invalid session token', async () => {
    const dependencies = createDependencies();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue(null);

    await expect(dependencies.service.authenticate('invalid-token')).resolves.toBeNull();

    expect(dependencies.authSessionsRepository.touch).not.toHaveBeenCalled();
  });

  it('removes a session during logout', async () => {
    const dependencies = createDependencies();

    await dependencies.service.logout('session-token');

    expect(dependencies.authSessionsRepository.deleteByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
    );
  });
});
