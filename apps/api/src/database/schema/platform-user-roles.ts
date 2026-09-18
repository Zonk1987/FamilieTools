import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { platformRoles } from './platform-roles.js';
import { users } from './users.js';

export const platformUserRoles = pgTable(
  'platform_user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    roleId: uuid('role_id')
      .notNull()
      .references(() => platformRoles.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('platform_user_roles_user_role_unique').on(table.userId, table.roleId),

    index('platform_user_roles_user_id_idx').on(table.userId),

    index('platform_user_roles_role_id_idx').on(table.roleId),
  ],
);
