import { Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';

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
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, new Date())))
      .limit(1);

    return result ?? null;
  }

  async touch(
    sessionId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    await database
      .update(authSessions)
      .set({
        lastSeenAt: new Date(),
      })
      .where(eq(authSessions.id, sessionId));
  }

  async deleteByTokenHash(
    tokenHash: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    await database.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
  }
}
