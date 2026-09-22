import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    moduleId: text('module_id').notNull(),

    version: text('version').notNull(),

    name: text('name').notNull(),

    description: text('description'),

    publisher: text('publisher').notNull(),

    installationPath: text('installation_path').notNull(),

    packageSha256: text('package_sha256').notNull(),

    installSource: text('install_source').default('local').notNull(),

    manifest: jsonb('manifest').$type<Record<string, unknown>>().notNull(),

    isEnabled: boolean('is_enabled').default(true).notNull(),

    installedAt: timestamp('installed_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('modules_module_id_version_unique').on(table.moduleId, table.version)],
);

export type Module = typeof modules.$inferSelect;

export type NewModule = typeof modules.$inferInsert;
