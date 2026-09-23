import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service.js';
import { authSessions, users } from '../database/schema/index.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';

describe('Authentication session cleanup integration', () => {
  const databaseService = new DatabaseService();

  const authSessionsRepository = new AuthSessionsRepository(databaseService);

  const testLoginName = `session-cleanup-${randomUUID()}`;

  let userId: string;

  afterAll(async () => {
    if (userId) {
      await databaseService.db.delete(users).where(eq(users.id, userId));
    }

    await databaseService.onApplicationShutdown();
  });

  it('deletes only expired sessions', async () => {
    const [user] = await databaseService.db
      .insert(users)
      .values({
        loginName: testLoginName,
        displayName: 'Session Cleanup Test',
        passwordHash: 'disabled-test-password',
      })
      .returning({
        id: users.id,
      });

    if (!user) {
      throw new Error('Failed to create session cleanup test user');
    }

    userId = user.id;

    const now = new Date('2026-09-23T10:00:00.000Z');

    const expiredTokenHash = `expired-${randomUUID()}`;

    const validTokenHash = `valid-${randomUUID()}`;

    await databaseService.db.insert(authSessions).values([
      {
        userId,
        tokenHash: expiredTokenHash,
        expiresAt: new Date(now.getTime() - 60_000),
      },
      {
        userId,
        tokenHash: validTokenHash,
        expiresAt: new Date(now.getTime() + 60_000),
      },
    ]);

    const deletedCount = await authSessionsRepository.deleteExpired(now);

    expect(deletedCount).toBe(1);

    const remainingSessions = await databaseService.db
      .select({
        tokenHash: authSessions.tokenHash,
      })
      .from(authSessions)
      .where(eq(authSessions.userId, userId));

    expect(remainingSessions).toHaveLength(1);

    expect(remainingSessions[0]?.tokenHash).toBe(validTokenHash);
  });
});
