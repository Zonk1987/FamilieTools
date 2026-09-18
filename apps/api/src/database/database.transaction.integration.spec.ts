import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { users } from './schema/index.js';

const TEST_DATABASE_URL =
  'postgresql://familietools:familietools_dev@localhost:5432/familietools_test';

describe('Database transaction integration', () => {
  let pool: Pool;
  let database: ReturnType<typeof drizzle>;

  beforeAll(() => {
    pool = new Pool({
      connectionString: TEST_DATABASE_URL,
    });

    database = drizzle(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rolls back inserted data when the transaction fails', async () => {
    const displayName = `Rollback Test ${Date.now()}`;

    await expect(
      database.transaction(async (tx) => {
        await tx.insert(users).values({
          displayName,
        });

        throw new Error('Simulated transaction failure');
      }),
    ).rejects.toThrow('Simulated transaction failure');

    const result = await database.select().from(users).where(eq(users.displayName, displayName));

    expect(result).toHaveLength(0);
  });
});
