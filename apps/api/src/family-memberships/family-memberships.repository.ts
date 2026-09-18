import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { familyMemberships } from '../database/schema/family-memberships.js';

export type NewFamilyMembership = typeof familyMemberships.$inferInsert;
export type FamilyMembership = typeof familyMemberships.$inferSelect;

@Injectable()
export class FamilyMembershipsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: NewFamilyMembership,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<FamilyMembership> {
    const [membership] = await database.insert(familyMemberships).values(data).returning();

    if (!membership) {
      throw new Error('Failed to create family membership');
    }

    return membership;
  }

  async findByFamilyAndUser(
    familyId: string,
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<FamilyMembership | null> {
    const [membership] = await database
      .select()
      .from(familyMemberships)
      .where(and(eq(familyMemberships.familyId, familyId), eq(familyMemberships.userId, userId)))
      .limit(1);

    return membership ?? null;
  }
}
