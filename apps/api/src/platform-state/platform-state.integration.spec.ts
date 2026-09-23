import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database/database.service.js';
import { platformState } from '../database/schema/index.js';
import { PlatformStateService } from './platform-state.service.js';

const PLATFORM_STATE_KEY = 'instance';

describe('PlatformStateService integration', () => {
  const databaseService = new DatabaseService();

  const platformStateService = new PlatformStateService(databaseService);

  afterAll(async () => {
    await databaseService.onApplicationShutdown();
  });

  it('allows exactly one concurrent setup claim', async () => {
    const [originalState] = await databaseService.db
      .select()
      .from(platformState)
      .where(eq(platformState.key, PLATFORM_STATE_KEY))
      .limit(1);

    try {
      if (originalState) {
        await databaseService.db
          .update(platformState)
          .set({
            initializationState: 'uninitialized',
            initializedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(platformState.key, PLATFORM_STATE_KEY));
      } else {
        await databaseService.db.insert(platformState).values({
          key: PLATFORM_STATE_KEY,
          initializationState: 'uninitialized',
        });
      }

      const [firstClaim, secondClaim] = await Promise.all([
        databaseService.transaction(async (transaction) =>
          platformStateService.claimSetup(transaction),
        ),
        databaseService.transaction(async (transaction) =>
          platformStateService.claimSetup(transaction),
        ),
      ]);

      expect([firstClaim, secondClaim].sort((left, right) => Number(left) - Number(right))).toEqual(
        [false, true],
      );

      const [claimedState] = await databaseService.db
        .select()
        .from(platformState)
        .where(eq(platformState.key, PLATFORM_STATE_KEY))
        .limit(1);

      expect(claimedState?.initializationState).toBe('initializing');
    } finally {
      if (originalState) {
        await databaseService.db
          .update(platformState)
          .set({
            initializationState: originalState.initializationState,
            initializedAt: originalState.initializedAt,
            createdAt: originalState.createdAt,
            updatedAt: originalState.updatedAt,
          })
          .where(eq(platformState.key, PLATFORM_STATE_KEY));
      } else {
        await databaseService.db
          .delete(platformState)
          .where(eq(platformState.key, PLATFORM_STATE_KEY));
      }
    }
  });
});
