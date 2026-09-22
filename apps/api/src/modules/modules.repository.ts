import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { modules, type Module, type NewModule } from '../database/schema/index.js';

@Injectable()
export class ModulesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: NewModule,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Module> {
    const [module] = await database.insert(modules).values(data).returning();

    if (!module) {
      throw new Error('Failed to create module');
    }

    return module;
  }

  async findById(
    id: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Module | null> {
    const [module] = await database.select().from(modules).where(eq(modules.id, id)).limit(1);

    return module ?? null;
  }

  async findByModuleIdAndVersion(
    moduleId: string,
    version: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Module | null> {
    const [module] = await database
      .select()
      .from(modules)
      .where(and(eq(modules.moduleId, moduleId), eq(modules.version, version)))
      .limit(1);

    return module ?? null;
  }

  async findByModuleId(
    moduleId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Module[]> {
    return database.select().from(modules).where(eq(modules.moduleId, moduleId));
  }

  async findAll(database: DatabaseExecutor = this.databaseService.db): Promise<Module[]> {
    return database.select().from(modules);
  }

  async findEnabled(database: DatabaseExecutor = this.databaseService.db): Promise<Module[]> {
    return database.select().from(modules).where(eq(modules.isEnabled, true));
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        NewModule,
        | 'name'
        | 'description'
        | 'isEnabled'
        | 'installationPath'
        | 'packageSha256'
        | 'installSource'
        | 'manifest'
      >
    >,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Module | null> {
    const [module] = await database
      .update(modules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    return module ?? null;
  }

  async delete(id: string, database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const deleted = await database.delete(modules).where(eq(modules.id, id)).returning({
      id: modules.id,
    });

    return deleted.length > 0;
  }
}
