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
    touchIfStale: vi.fn(),
    deleteByTokenHash: vi.fn(),
    deleteExpired: vi.fn(),
  };

  const transaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback({}),
  );

  const databaseService = {
    transaction,
  };

  const auditService = {
    append: vi.fn(),
  };

  const service = new AuthService(
    usersRepository as never,
    passwordService as never,
    authSessionsRepository as never,
    databaseService as never,
    auditService as never,
  );

  return {
    service,
    usersRepository,
    passwordService,
    authSessionsRepository,
    databaseService,
    auditService,
  };
}

describe('AuthService', () => {
  it('accepts a session that is still inside the idle timeout', async () => {
    const dependencies = createDependencies();

    const now = Date.now();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(now - 24 * 60 * 60 * 1000),
    });

    await expect(dependencies.service.authenticate('session-token')).resolves.toEqual({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(dependencies.authSessionsRepository.findValidByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
    );
  });

  it('returns null when the repository rejects an idle-expired session', async () => {
    const dependencies = createDependencies();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue(null);

    await expect(dependencies.service.authenticate('session-token')).resolves.toBeNull();

    expect(dependencies.authSessionsRepository.findValidByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
    );

    expect(dependencies.authSessionsRepository.touchIfStale).not.toHaveBeenCalled();
  });

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

    const result = await dependencies.service.login(
      ' Sebastian ',
      'very-secure-password',
      'request-123',
    );

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
      expect.anything(),
    );

    expect(dependencies.auditService.append).toHaveBeenCalledWith(
      {
        actor: {
          type: 'user',
          id: 'user-1',
        },
        scope: {
          type: 'platform',
        },
        action: 'auth.login.succeeded',
        result: 'success',
        requestId: 'request-123',
        target: {
          type: 'auth-session',
          id: 'session-1',
        },
      },
      expect.anything(),
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
      dependencies.service.login('unknown', 'very-secure-password', 'request-456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(dependencies.passwordService.verify).toHaveBeenCalledWith(
      'very-secure-password',
      expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
    );

    expect(dependencies.authSessionsRepository.create).not.toHaveBeenCalled();

    expect(dependencies.auditService.append).toHaveBeenCalledWith({
      actor: {
        type: 'anonymous',
      },
      scope: {
        type: 'platform',
      },
      action: 'auth.login.failed',
      result: 'failure',
      requestId: 'request-456',
      metadata: {
        reason: 'invalid_credentials',
      },
    });
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

    await expect(
      dependencies.service.login('sebastian', 'wrong-password', 'request-789'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(dependencies.authSessionsRepository.create).not.toHaveBeenCalled();

    expect(dependencies.auditService.append).toHaveBeenCalledWith({
      actor: {
        type: 'anonymous',
      },
      scope: {
        type: 'platform',
      },
      action: 'auth.login.failed',
      result: 'failure',
      requestId: 'request-789',
      metadata: {
        reason: 'invalid_credentials',
      },
    });
  });

  it('returns a user without touching a recently seen session', async () => {
    const dependencies = createDependencies();

    const now = new Date();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-12-01T00:00:00.000Z'),
      lastSeenAt: new Date(now.getTime() - 5 * 60 * 1000),
    });

    const result = await dependencies.service.authenticate('session-token');

    expect(dependencies.authSessionsRepository.findValidByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
    );

    expect(dependencies.authSessionsRepository.touchIfStale).not.toHaveBeenCalled();

    expect(result).toEqual({
      id: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('touches a stale session before returning the user', async () => {
    const dependencies = createDependencies();

    const now = new Date();

    dependencies.authSessionsRepository.findValidByTokenHash.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      loginName: 'sebastian',
      displayName: 'Sebastian',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-12-01T00:00:00.000Z'),
      lastSeenAt: new Date(now.getTime() - 20 * 60 * 1000),
    });

    const result = await dependencies.service.authenticate('session-token');

    expect(dependencies.authSessionsRepository.touchIfStale).toHaveBeenCalledTimes(1);

    expect(dependencies.authSessionsRepository.touchIfStale).toHaveBeenCalledWith(
      'session-1',
      expect.any(Date),
    );

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

    expect(dependencies.authSessionsRepository.touchIfStale).not.toHaveBeenCalled();
  });

  it('removes a session during logout', async () => {
    const dependencies = createDependencies();

    await dependencies.service.logout('session-token');

    expect(dependencies.authSessionsRepository.deleteByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
    );

    expect(dependencies.auditService.append).toHaveBeenCalledWith(
      {
        actor: {
          type: 'anonymous',
        },
        scope: {
          type: 'platform',
        },
        action: 'auth.logout',
        result: 'success',
      },
      expect.anything(),
    );
  });

  it('audits logout with the authenticated user as actor', async () => {
    const dependencies = createDependencies();

    await dependencies.service.logout('session-token', 'user-1', 'request-logout-1');

    expect(dependencies.authSessionsRepository.deleteByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
    );

    expect(dependencies.auditService.append).toHaveBeenCalledWith(
      {
        actor: {
          type: 'user',
          id: 'user-1',
        },
        scope: {
          type: 'platform',
        },
        action: 'auth.logout',
        result: 'success',
        requestId: 'request-logout-1',
      },
      expect.anything(),
    );
  });

  it('cleans up expired sessions', async () => {
    const dependencies = createDependencies();

    const now = new Date('2026-09-23T10:00:00.000Z');

    dependencies.authSessionsRepository.deleteExpired.mockResolvedValue(3);

    await expect(dependencies.service.cleanupExpiredSessions(now)).resolves.toBe(3);

    expect(dependencies.authSessionsRepository.deleteExpired).toHaveBeenCalledWith(now);
  });
});
