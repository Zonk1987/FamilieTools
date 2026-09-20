import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import {
  type NewUserPreference,
  type UserPreference,
  userPreferences,
} from '../database/schema/index.js';

@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByUserId(
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<UserPreference | null> {
    const [preference] = await database
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return preference ?? null;
  }

  async upsert(
    data: NewUserPreference,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<UserPreference> {
    const now = new Date();

    const [preference] = await database
      .insert(userPreferences)
      .values({
        ...data,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          themeId: data.themeId,
          colorScheme: data.colorScheme,
          density: data.density,
          reducedMotion: data.reducedMotion,
          updatedAt: now,
        },
      })
      .returning();

    if (!preference) {
      throw new Error('Failed to save user preferences');
    }

    return preference;
  }
}
