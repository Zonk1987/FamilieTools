import { eq } from 'drizzle-orm';

import { DatabaseService } from '../database/database.service.js';
import { platformRoleCapabilities, platformRoles } from '../database/schema/index.js';
import { PLATFORM_CAPABILITIES, PLATFORM_OWNER_ROLE_KEY } from './platform-capabilities.js';

export async function seedPlatformAuthorization(databaseService: DatabaseService): Promise<void> {
  const existingRole = await databaseService.db.query.platformRoles.findFirst({
    where: eq(platformRoles.key, PLATFORM_OWNER_ROLE_KEY),
  });

  let roleId: string;

  if (existingRole) {
    roleId = existingRole.id;
  } else {
    const [createdRole] = await databaseService.db
      .insert(platformRoles)
      .values({
        key: PLATFORM_OWNER_ROLE_KEY,
        name: 'Platform Owner',
        description: 'Full administrative access to the FamilieTools instance.',
        isSystem: true,
      })
      .returning();

    if (!createdRole) {
      throw new Error('Failed to create platform owner role');
    }

    roleId = createdRole.id;
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
