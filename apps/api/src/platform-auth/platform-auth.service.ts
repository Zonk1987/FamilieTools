import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { DatabaseExecutor } from '../database/database.service.js';

import { DatabaseService } from '../database/database.service.js';
import {
  platformRoleCapabilities,
  platformRoles,
  platformUserRoles,
} from '../database/schema/index.js';
import { PLATFORM_OWNER_ROLE_KEY } from './platform-capabilities.js';
import { seedPlatformAuthorization } from './platform-auth.seed.js';

@Injectable()
export class PlatformAuthService implements OnApplicationBootstrap {
  constructor(private readonly databaseService: DatabaseService) {}

  async onApplicationBootstrap(): Promise<void> {
    await seedPlatformAuthorization(this.databaseService);

    const bootstrapOwnerUserId = process.env.PLATFORM_OWNER_USER_ID;

    if (bootstrapOwnerUserId) {
      await this.assignPlatformOwner(bootstrapOwnerUserId);
    }
  }

  async assignPlatformOwner(
    userId: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<void> {
    const [role] = await database
      .select()
      .from(platformRoles)
      .where(eq(platformRoles.key, PLATFORM_OWNER_ROLE_KEY))
      .limit(1);

    if (!role) {
      throw new Error('Platform owner role is not initialized');
    }

    const [existingAssignment] = await database
      .select()
      .from(platformUserRoles)
      .where(and(eq(platformUserRoles.userId, userId), eq(platformUserRoles.roleId, role.id)))
      .limit(1);

    if (existingAssignment) {
      return;
    }

    await database.insert(platformUserRoles).values({
      userId,
      roleId: role.id,
    });
  }

  async hasPlatformRole(
    userId: string,
    roleKey: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<boolean> {
    const [assignment] = await database
      .select({
        roleId: platformRoles.id,
      })
      .from(platformUserRoles)
      .innerJoin(platformRoles, eq(platformUserRoles.roleId, platformRoles.id))
      .where(and(eq(platformUserRoles.userId, userId), eq(platformRoles.key, roleKey)))
      .limit(1);

    return Boolean(assignment);
  }

  async hasCapability(
    userId: string,
    capability: string,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<boolean> {
    const [result] = await database
      .select({
        capability: platformRoleCapabilities.capability,
      })
      .from(platformUserRoles)
      .innerJoin(platformRoles, eq(platformUserRoles.roleId, platformRoles.id))
      .innerJoin(platformRoleCapabilities, eq(platformRoleCapabilities.roleId, platformRoles.id))
      .where(
        and(
          eq(platformUserRoles.userId, userId),
          eq(platformRoleCapabilities.capability, capability),
        ),
      )
      .limit(1);

    return Boolean(result);
  }
}
