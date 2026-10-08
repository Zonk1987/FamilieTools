import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import {
  workspaceMemberships,
  type NewWorkspaceMembership,
  type WorkspaceMembership,
} from '../database/schema/index.js';

@Injectable()
export class WorkspaceMembershipsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createIfAbsent(
    data: NewWorkspaceMembership,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<WorkspaceMembership | null> {
    const [membership] = await database
      .insert(workspaceMemberships)
      .values(data)
      .onConflictDoNothing({
        target: [workspaceMemberships.workspaceId, workspaceMemberships.userId],
      })
      .returning();

    return membership ?? null;
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<WorkspaceMembership | null> {
    const [membership] = await database
      .select()
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, workspaceId),
          eq(workspaceMemberships.userId, userId),
        ),
      )
      .limit(1);

    return membership ?? null;
  }

  async findByWorkspace(
    workspaceId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<WorkspaceMembership[]> {
    return database
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.workspaceId, workspaceId));
  }

  async findByUser(
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<WorkspaceMembership[]> {
    return database
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.userId, userId));
  }

  async delete(
    workspaceId: string,
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<boolean> {
    const deleted = await database
      .delete(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, workspaceId),
          eq(workspaceMemberships.userId, userId),
        ),
      )
      .returning({
        id: workspaceMemberships.id,
      });

    return deleted.length > 0;
  }
}
