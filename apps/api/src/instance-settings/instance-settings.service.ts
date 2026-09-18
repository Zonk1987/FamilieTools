import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { instanceSettings } from '../database/schema/index.js';
import type { InstanceSettingKey } from './instance-setting-keys.js';

@Injectable()
export class InstanceSettingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async get(
    key: InstanceSettingKey,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<string | null> {
    const [setting] = await database
      .select()
      .from(instanceSettings)
      .where(eq(instanceSettings.key, key))
      .limit(1);

    return setting?.value ?? null;
  }

  async set(
    key: InstanceSettingKey,
    value: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    const now = new Date();

    await database
      .insert(instanceSettings)
      .values({
        key,
        value,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: instanceSettings.key,
        set: {
          value,
          updatedAt: now,
        },
      });
  }

  async getMany(
    keys: readonly InstanceSettingKey[],
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<Record<InstanceSettingKey, string | null>> {
    const result = {} as Record<InstanceSettingKey, string | null>;

    for (const key of keys) {
      result[key] = await this.get(key, database);
    }

    return result;
  }
}
