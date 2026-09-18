import { boolean, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { themes } from './themes.js';
import { users } from './users.js';

export const colorSchemePreferenceEnum = pgEnum('color_scheme_preference', [
  'system',
  'light',
  'dark',
]);

export const densityPreferenceEnum = pgEnum('density_preference', ['comfortable', 'compact']);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  themeId: uuid('theme_id').references(() => themes.id, {
    onDelete: 'set null',
  }),

  colorScheme: colorSchemePreferenceEnum('color_scheme').default('system').notNull(),

  density: densityPreferenceEnum('density').default('comfortable').notNull(),

  reducedMotion: boolean('reduced_motion').default(false).notNull(),

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

export type UserPreference = typeof userPreferences.$inferSelect;

export type NewUserPreference = typeof userPreferences.$inferInsert;
