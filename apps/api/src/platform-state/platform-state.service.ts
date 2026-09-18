import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DatabaseExecutor } from '../database/database.service.js';

import { DatabaseService } from '../database/database.service.js';
import { platformState } from '../database/schema/index.js';

export type PlatformInitializationState =
  'uninitialized' | 'initializing' | 'ready' | 'maintenance';

const PLATFORM_STATE_KEY = 'instance';

@Injectable()
export class PlatformStateService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getState(
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<PlatformInitializationState> {
    const [existing] = await database
      .select()
      .from(platformState)
      .where(eq(platformState.key, PLATFORM_STATE_KEY))
      .limit(1);

    if (existing) {
      return existing.initializationState;
    }

    const [created] = await database
      .insert(platformState)
      .values({
        key: PLATFORM_STATE_KEY,
        initializationState: 'uninitialized',
      })
      .returning();

    if (!created) {
      throw new Error('Failed to initialize platform state');
    }

    return created.initializationState;
  }

  async isInitialized(database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const state = await this.getState(database);

    return state === 'ready' || state === 'maintenance';
  }

  async isSetupAllowed(database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const state = await this.getState(database);

    return state === 'uninitialized' || state === 'initializing';
  }

  async setState(
    state: PlatformInitializationState,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    const now = new Date();

    await database
      .insert(platformState)
      .values({
        key: PLATFORM_STATE_KEY,
        initializationState: state,
        initializedAt: state === 'ready' ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: platformState.key,
        set: {
          initializationState: state,
          initializedAt: state === 'ready' ? now : null,
          updatedAt: now,
        },
      });
  }
}
