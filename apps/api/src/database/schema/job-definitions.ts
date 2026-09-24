import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const jobOwnerTypeEnum = pgEnum('job_owner_type', [
  'platform',
  'workspace',
  'domain',
  'module-instance',
]);

export const jobDefinitions = pgTable(
  'job_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    key: text('key').notNull(),

    ownerType: jobOwnerTypeEnum('owner_type').notNull(),

    ownerId: uuid('owner_id'),

    name: text('name').notNull(),

    description: text('description'),

    handler: text('handler').notNull(),

    defaultTimeoutSeconds: integer('default_timeout_seconds').default(300).notNull(),

    maxRetries: integer('max_retries').default(0).notNull(),

    retryDelaySeconds: integer('retry_delay_seconds').default(0).notNull(),

    isEnabled: boolean('is_enabled').default(true).notNull(),

    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),

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
    uniqueIndex('job_definitions_platform_key_unique')
      .on(table.key)
      .where(sql`${table.ownerType} = 'platform'`),

    uniqueIndex('job_definitions_scoped_owner_key_unique')
      .on(table.ownerType, table.ownerId, table.key)
      .where(sql`${table.ownerType} <> 'platform'`),

    check('job_definitions_timeout_positive', sql`${table.defaultTimeoutSeconds} > 0`),

    check('job_definitions_max_retries_non_negative', sql`${table.maxRetries} >= 0`),

    check('job_definitions_retry_delay_non_negative', sql`${table.retryDelaySeconds} >= 0`),

    check(
      'job_definitions_owner_scope_valid',
      sql`
        (
          ${table.ownerType} = 'platform'
          AND ${table.ownerId} IS NULL
        )
        OR
        (
          ${table.ownerType} <> 'platform'
          AND ${table.ownerId} IS NOT NULL
        )
      `,
    ),

    check('job_definitions_key_not_empty', sql`length(trim(${table.key})) > 0`),

    check('job_definitions_name_not_empty', sql`length(trim(${table.name})) > 0`),

    check('job_definitions_handler_not_empty', sql`length(trim(${table.handler})) > 0`),
  ],
);

export type JobDefinition = typeof jobDefinitions.$inferSelect;

export type NewJobDefinition = typeof jobDefinitions.$inferInsert;
