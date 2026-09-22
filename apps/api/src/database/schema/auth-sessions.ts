import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    tokenHash: text('token_hash').notNull().unique(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    lastSeenAt: timestamp('last_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('auth_sessions_user_id_idx').on(table.userId),

    index('auth_sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export type AuthSession = typeof authSessions.$inferSelect;

export type NewAuthSession = typeof authSessions.$inferInsert;
