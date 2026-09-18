import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { families } from '../database/schema/families.js';

export type NewFamily = typeof families.$inferInsert;
export type Family = typeof families.$inferSelect;

@Injectable()
export class FamiliesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: NewFamily,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Family> {
    const [family] = await database.insert(families).values(data).returning();

    if (!family) {
      throw new Error('Failed to create family');
    }

    return family;
  }

  async findById(
    id: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Family | null> {
    const [family] = await database.select().from(families).where(eq(families.id, id)).limit(1);

    return family ?? null;
  }
}
