import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

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
});
