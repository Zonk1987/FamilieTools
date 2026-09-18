import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const platformRoles = pgTable(
  'platform_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    key: text('key').notNull(),

    name: text('name').notNull(),

    description: text('description'),

    isSystem: boolean('is_system').notNull().default(false),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('platform_roles_key_unique').on(table.key)],
);
