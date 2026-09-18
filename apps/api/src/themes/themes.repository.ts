import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { themes, type NewTheme, type Theme } from '../database/schema/index.js';

@Injectable()
export class ThemesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: NewTheme,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Theme> {
    const [theme] = await database.insert(themes).values(data).returning();

    if (!theme) {
      throw new Error('Failed to create theme');
    }

    return theme;
  }

  async findById(
    id: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Theme | null> {
    const [theme] = await database.select().from(themes).where(eq(themes.id, id)).limit(1);

    return theme ?? null;
  }

  async findBySlug(
    slug: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Theme | null> {
    const [theme] = await database.select().from(themes).where(eq(themes.slug, slug)).limit(1);

    return theme ?? null;
  }

  async findDefault(database: DatabaseExecutor = this.databaseService.db): Promise<Theme | null> {
    const [theme] = await database.select().from(themes).where(eq(themes.isDefault, true)).limit(1);

    return theme ?? null;
  }

  async findAll(database: DatabaseExecutor = this.databaseService.db): Promise<Theme[]> {
    return database.select().from(themes);
  }

  async findEnabled(database: DatabaseExecutor = this.databaseService.db): Promise<Theme[]> {
    return database.select().from(themes).where(eq(themes.isEnabled, true));
  }

  async update(
    id: string,
    data: Partial<
      Pick<NewTheme, 'name' | 'slug' | 'description' | 'tokens' | 'isEnabled' | 'isDefault'>
    >,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Theme | null> {
    const [theme] = await database
      .update(themes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(themes.id, id))
      .returning();

    return theme ?? null;
  }

  async clearDefault(database: DatabaseExecutor = this.databaseService.db): Promise<void> {
    await database
      .update(themes)
      .set({
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(eq(themes.isDefault, true));
  }

  async delete(id: string, database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const deleted = await database
      .delete(themes)
      .where(and(eq(themes.id, id), eq(themes.isSystem, false)))
      .returning({
        id: themes.id,
      });

    return deleted.length > 0;
  }
}
