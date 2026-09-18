import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const platformInitializationState = pgEnum('platform_initialization_state', [
  'uninitialized',
  'initializing',
  'ready',
  'maintenance',
]);

export const platformState = pgTable('platform_state', {
  key: text('key').primaryKey(),

  initializationState: platformInitializationState('initialization_state')
    .notNull()
    .default('uninitialized'),

  initializedAt: timestamp('initialized_at', {
    withTimezone: true,
  }),

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
});
