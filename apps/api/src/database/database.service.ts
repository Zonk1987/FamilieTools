import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

export type DatabaseClient = NodePgDatabase<typeof schema>;

export type DatabaseTransaction = Parameters<Parameters<DatabaseClient['transaction']>[0]>[0];

export type DatabaseExecutor = DatabaseClient | DatabaseTransaction;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;

  readonly db: DatabaseClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    this.pool = new Pool({
      connectionString,
    });

    this.db = drizzle(this.pool, {
      schema,
    });
  }

  async transaction<T>(callback: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
