import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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
      .onConflictDoNothing({
        target: platformState.key,
      })
      .returning();

    if (created) {
      return created.initializationState;
    }

    const [concurrent] = await database
      .select()
      .from(platformState)
      .where(eq(platformState.key, PLATFORM_STATE_KEY))
      .limit(1);

    if (!concurrent) {
      throw new Error('Failed to initialize platform state');
    }

    return concurrent.initializationState;
  }

  async isInitialized(database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const state = await this.getState(database);

    return state === 'ready' || state === 'maintenance';
  }

  async isSetupAllowed(database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    const state = await this.getState(database);

    return state === 'uninitialized';
  }

  async claimSetup(database: DatabaseExecutor = this.databaseService.db): Promise<boolean> {
    await this.getState(database);

    const [claimed] = await database
      .update(platformState)
      .set({
        initializationState: 'initializing',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(platformState.key, PLATFORM_STATE_KEY),
          eq(platformState.initializationState, 'uninitialized'),
        ),
      )
      .returning({
        key: platformState.key,
      });

    return Boolean(claimed);
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
