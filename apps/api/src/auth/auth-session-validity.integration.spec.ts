import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service.js';
import { authSessions, users } from '../database/schema/index.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';

describe('Authentication session validity integration', () => {
  const databaseService = new DatabaseService();

  const authSessionsRepository = new AuthSessionsRepository(databaseService);

  const testLoginName = `session-validity-${randomUUID()}`;

  let userId: string;

  afterAll(async () => {
    if (userId) {
      await databaseService.db.delete(users).where(eq(users.id, userId));
    }

    await databaseService.onApplicationShutdown();
  });

  it('accepts active sessions and rejects idle-expired or absolutely expired sessions', async () => {
    const [user] = await databaseService.db
      .insert(users)
      .values({
        loginName: testLoginName,
        displayName: 'Session Validity Test',
        passwordHash: 'disabled-test-password',
      })
      .returning({
        id: users.id,
      });

    if (!user) {
      throw new Error('Failed to create session validity test user');
    }

    userId = user.id;

    const now = new Date();
    const idleAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeTokenHash = `active-${randomUUID()}`;

    const idleExpiredTokenHash = `idle-expired-${randomUUID()}`;

    const absoluteExpiredTokenHash = `absolute-expired-${randomUUID()}`;

    await databaseService.db.insert(authSessions).values([
      {
        userId,
        tokenHash: activeTokenHash,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        userId,
        tokenHash: idleExpiredTokenHash,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        tokenHash: absoluteExpiredTokenHash,
        expiresAt: new Date(now.getTime() - 60 * 1000),
        lastSeenAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
    ]);

    const activeSession = await authSessionsRepository.findValidByTokenHash(
      activeTokenHash,
      idleAfter,
    );

    expect(activeSession).not.toBeNull();

    const idleExpiredSession = await authSessionsRepository.findValidByTokenHash(
      idleExpiredTokenHash,
      idleAfter,
    );

    expect(idleExpiredSession).toBeNull();

    const absoluteExpiredSession = await authSessionsRepository.findValidByTokenHash(
      absoluteExpiredTokenHash,
      idleAfter,
    );

    expect(absoluteExpiredSession).toBeNull();
  });
});
