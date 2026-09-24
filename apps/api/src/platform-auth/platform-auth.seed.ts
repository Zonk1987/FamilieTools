import { eq } from 'drizzle-orm';

import { DatabaseService } from '../database/database.service.js';
import { platformRoleCapabilities, platformRoles } from '../database/schema/index.js';
import { PLATFORM_CAPABILITIES, PLATFORM_OWNER_ROLE_KEY } from './platform-capabilities.js';

export async function seedPlatformAuthorization(databaseService: DatabaseService): Promise<void> {
  const [createdRole] = await databaseService.db
    .insert(platformRoles)
    .values({
      key: PLATFORM_OWNER_ROLE_KEY,
      name: 'Platform Owner',
      description: 'Full administrative access to the FamilieTools instance.',
      isSystem: true,
    })
    .onConflictDoNothing({
      target: platformRoles.key,
    })
    .returning({
      id: platformRoles.id,
    });

  let roleId = createdRole?.id;

  if (!roleId) {
    const existingRole = await databaseService.db.query.platformRoles.findFirst({
      where: eq(platformRoles.key, PLATFORM_OWNER_ROLE_KEY),
    });

    if (!existingRole) {
      throw new Error('Platform owner role could not be created or loaded');
    }

    roleId = existingRole.id;
  }

  for (const capability of PLATFORM_CAPABILITIES) {
    await databaseService.db
      .insert(platformRoleCapabilities)
      .values({
        roleId,
        capability,
      })
      .onConflictDoNothing();
  }
}
