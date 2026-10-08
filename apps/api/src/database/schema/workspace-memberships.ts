import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';
import { workspaces } from './workspaces.js';

export const workspaceMemberships = pgTable(
  'workspace_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('workspace_memberships_workspace_user_unique').on(table.workspaceId, table.userId),

    index('workspace_memberships_workspace_id_idx').on(table.workspaceId),

    index('workspace_memberships_user_id_idx').on(table.userId),
  ],
);

export type WorkspaceMembership = typeof workspaceMemberships.$inferSelect;

export type NewWorkspaceMembership = typeof workspaceMemberships.$inferInsert;
