import 'dotenv/config';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { DatabaseService } from './database.service.js';
import { families } from './schema/index.js';

describe('Database transaction integration', () => {
  const databaseService = new DatabaseService();

  afterAll(async () => {
    await databaseService.onApplicationShutdown();
  });

  it('rolls back inserted data when the transaction fails', async () => {
    const familyName = `Rollback Test ${randomUUID()}`;

    await expect(
      databaseService.transaction(async (transaction) => {
        await transaction.insert(families).values({
          name: familyName,
        });

        throw new Error('Simulated transaction failure');
      }),
    ).rejects.toThrow('Simulated transaction failure');

    const result = await databaseService.db
      .select()
      .from(families)
      .where(eq(families.name, familyName));

    expect(result).toHaveLength(0);
  });
});
