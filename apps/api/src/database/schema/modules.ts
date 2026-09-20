import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),

  key: text('key').notNull().unique(),

  name: text('name').notNull(),

  description: text('description'),

  isEnabled: boolean('is_enabled').default(true).notNull(),

  isSystem: boolean('is_system').default(false).notNull(),

  isRequired: boolean('is_required').default(false).notNull(),

  defaultEnabledForFamilies: boolean('default_enabled_for_families').default(true).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
