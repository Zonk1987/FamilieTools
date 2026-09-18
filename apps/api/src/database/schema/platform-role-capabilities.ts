import { index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { platformRoles } from './platform-roles.js';

export const platformRoleCapabilities = pgTable(
  'platform_role_capabilities',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    roleId: uuid('role_id')
      .notNull()
      .references(() => platformRoles.id, {
        onDelete: 'cascade',
      }),

    capability: text('capability').notNull(),
  },
  (table) => [
    uniqueIndex('platform_role_capabilities_role_capability_unique').on(
      table.roleId,
      table.capability,
    ),

    index('platform_role_capabilities_role_id_idx').on(table.roleId),

    index('platform_role_capabilities_capability_idx').on(table.capability),
  ],
);
