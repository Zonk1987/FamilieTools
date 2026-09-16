import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { families } from './families.js';
import { users } from './users.js';

export const familyMemberships = pgTable(
  'family_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, {
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
    uniqueIndex('family_memberships_family_user_unique').on(table.familyId, table.userId),

    index('family_memberships_family_id_idx').on(table.familyId),

    index('family_memberships_user_id_idx').on(table.userId),
  ],
);
