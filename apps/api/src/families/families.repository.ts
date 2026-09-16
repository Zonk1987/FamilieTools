import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../database/database.service.js';
import { families } from '../database/schema/families.js';

export type NewFamily = typeof families.$inferInsert;
export type Family = typeof families.$inferSelect;

@Injectable()
export class FamiliesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewFamily): Promise<Family> {
    const [family] = await this.databaseService.db.insert(families).values(data).returning();

    if (!family) {
      throw new Error('Failed to create family');
    }

    return family;
  }

  async findById(id: string): Promise<Family | null> {
    const [family] = await this.databaseService.db
      .select()
      .from(families)
      .where(eq(families.id, id))
      .limit(1);

    return family ?? null;
  }
}
