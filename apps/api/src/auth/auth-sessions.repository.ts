import { Injectable } from '@nestjs/common';
import { and, eq, gt, lte, lt } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { authSessions, users, type NewAuthSession } from '../database/schema/index.js';

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewAuthSession, database: DatabaseExecutor = this.databaseService.db) {
    const [session] = await database.insert(authSessions).values(data).returning();

    if (!session) {
      throw new Error('Failed to create authentication session');
    }

    return session;
  }

  async findValidByTokenHash(
    tokenHash: string,
    idleAfter: Date,
    database: DatabaseExecutor = this.databaseService.db,
  ) {
    const [result] = await database
      .select({
        sessionId: authSessions.id,
        userId: users.id,
        loginName: users.loginName,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        expiresAt: authSessions.expiresAt,
        lastSeenAt: authSessions.lastSeenAt,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          gt(authSessions.expiresAt, new Date()),
          gt(authSessions.lastSeenAt, idleAfter),
        ),
      )
      .limit(1);

    return result ?? null;
  }

  async touchIfStale(
    sessionId: string,
    staleBefore: Date,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    await database
      .update(authSessions)
      .set({
        lastSeenAt: new Date(),
      })
      .where(and(eq(authSessions.id, sessionId), lt(authSessions.lastSeenAt, staleBefore)));
  }

  async deleteByTokenHash(
    tokenHash: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    await database.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
  }

  async deleteExpired(
    now: Date = new Date(),
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<number> {
    const deleted = await database
      .delete(authSessions)
      .where(lte(authSessions.expiresAt, now))
      .returning({
        id: authSessions.id,
      });

    return deleted.length;
  }
}
