import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export type ThemeTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    danger: string;
    dangerForeground: string;
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
  };
  typography: {
    fontFamily: string;
  };
  radius: {
    small: string;
    medium: string;
    large: string;
  };
  shadow: {
    small: string;
    medium: string;
    large: string;
  };
};

export const themes = pgTable('themes', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  description: text('description'),

  tokens: jsonb('tokens').$type<ThemeTokens>().notNull(),

  isEnabled: boolean('is_enabled').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isSystem: boolean('is_system').default(false).notNull(),

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

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
