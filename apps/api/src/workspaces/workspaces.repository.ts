import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { workspaces, type NewWorkspace, type Workspace } from '../database/schema/index.js';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: NewWorkspace,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Workspace> {
    const [workspace] = await database.insert(workspaces).values(data).returning();

    if (!workspace) {
      throw new Error('Failed to create workspace');
    }

    return workspace;
  }

  async findById(
    id: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Workspace | null> {
    const [workspace] = await database
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    return workspace ?? null;
  }

  async findBySlug(
    slug: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Workspace | null> {
    const [workspace] = await database
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    return workspace ?? null;
  }

  async findAll(database: DatabaseExecutor = this.databaseService.db): Promise<Workspace[]> {
    return database.select().from(workspaces);
  }

  async update(
    id: string,
    data: Partial<Pick<NewWorkspace, 'name' | 'slug' | 'description' | 'isActive'>>,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Workspace | null> {
    const [workspace] = await database
      .update(workspaces)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning();

    return workspace ?? null;
  }

  async delete(id: string, database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const deleted = await database.delete(workspaces).where(eq(workspaces.id, id)).returning({
      id: workspaces.id,
    });

    return deleted.length > 0;
  }
}
