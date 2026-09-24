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
  uuid,
} from 'drizzle-orm/pg-core';

import { jobDefinitions } from './job-definitions.js';

export const jobScheduleTypeEnum = pgEnum('job_schedule_type', ['once', 'interval', 'cron']);

export const jobSchedules = pgTable(
  'job_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    jobDefinitionId: uuid('job_definition_id')
      .notNull()
      .references(() => jobDefinitions.id, {
        onDelete: 'cascade',
      }),

    scheduleType: jobScheduleTypeEnum('schedule_type').notNull(),

    runAt: timestamp('run_at', {
      withTimezone: true,
      mode: 'date',
    }),

    intervalSeconds: integer('interval_seconds'),

    cronExpression: text('cron_expression'),

    timezone: text('timezone').default('UTC').notNull(),

    nextRunAt: timestamp('next_run_at', {
      withTimezone: true,
      mode: 'date',
    }),

    lastRunAt: timestamp('last_run_at', {
      withTimezone: true,
      mode: 'date',
    }),

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
    check(
      'job_schedules_configuration_valid',
      sql`
        (
          ${table.scheduleType} = 'once'
          AND ${table.runAt} IS NOT NULL
          AND ${table.intervalSeconds} IS NULL
          AND ${table.cronExpression} IS NULL
        )
        OR
        (
          ${table.scheduleType} = 'interval'
          AND ${table.runAt} IS NULL
          AND ${table.intervalSeconds} IS NOT NULL
          AND ${table.intervalSeconds} > 0
          AND ${table.cronExpression} IS NULL
        )
        OR
        (
          ${table.scheduleType} = 'cron'
          AND ${table.runAt} IS NULL
          AND ${table.intervalSeconds} IS NULL
          AND ${table.cronExpression} IS NOT NULL
          AND length(trim(${table.cronExpression})) > 0
        )
      `,
    ),

    check('job_schedules_timezone_not_empty', sql`length(trim(${table.timezone})) > 0`),
  ],
);

export type JobSchedule = typeof jobSchedules.$inferSelect;

export type NewJobSchedule = typeof jobSchedules.$inferInsert;
