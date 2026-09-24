import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { jobDefinitions } from './job-definitions.js';
import { jobSchedules } from './job-schedules.js';

export const jobRunStatusEnum = pgEnum('job_run_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'timed_out',
]);

export const jobTriggerTypeEnum = pgEnum('job_trigger_type', [
  'manual',
  'schedule',
  'event',
  'system',
]);

export const jobRuns = pgTable(
  'job_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    jobDefinitionId: uuid('job_definition_id')
      .notNull()
      .references(() => jobDefinitions.id, {
        onDelete: 'cascade',
      }),

    scheduleId: uuid('schedule_id').references(() => jobSchedules.id, {
      onDelete: 'set null',
    }),

    scheduledFor: timestamp('scheduled_for', {
      withTimezone: true,
      mode: 'date',
    }),

    status: jobRunStatusEnum('status').default('queued').notNull(),

    triggerType: jobTriggerTypeEnum('trigger_type').notNull(),

    attempt: integer('attempt').default(1).notNull(),

    requestedByType: text('requested_by_type'),

    requestedById: text('requested_by_id'),

    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'date',
    }),

    finishedAt: timestamp('finished_at', {
      withTimezone: true,
      mode: 'date',
    }),

    timeoutAt: timestamp('timeout_at', {
      withTimezone: true,
      mode: 'date',
    }),

    errorCode: text('error_code'),

    errorMessage: text('error_message'),

    claimedBy: text('claimed_by'),

    claimedAt: timestamp('claimed_at', {
      withTimezone: true,
      mode: 'date',
    }),

    leaseExpiresAt: timestamp('lease_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),

    input: jsonb('input').$type<Record<string, unknown>>().default({}).notNull(),

    output: jsonb('output').$type<Record<string, unknown>>().default({}).notNull(),

    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('job_runs_claimable_idx').on(table.status, table.leaseExpiresAt, table.createdAt),

    uniqueIndex('job_runs_schedule_fire_unique').on(table.scheduleId, table.scheduledFor),

    check('job_runs_attempt_positive', sql`${table.attempt} >= 1`),

    check(
      'job_runs_trigger_schedule_valid',
      sql`
        ${table.triggerType} = 'schedule'
        OR ${table.scheduleId} IS NULL
      `,
    ),

    check(
      'job_runs_scheduled_for_valid',
      sql`
        (
          ${table.triggerType} = 'schedule'
          AND ${table.scheduledFor} IS NOT NULL
        )
        OR
        (
          ${table.triggerType} <> 'schedule'
          AND ${table.scheduledFor} IS NULL
        )
      `,
    ),

    check(
      'job_runs_status_timestamps_valid',
      sql`
        (
          ${table.status} = 'queued'
          AND ${table.startedAt} IS NULL
          AND ${table.finishedAt} IS NULL
        )
        OR
        (
          ${table.status} = 'running'
          AND ${table.startedAt} IS NOT NULL
          AND ${table.finishedAt} IS NULL
        )
        OR
        (
          ${table.status} IN (
            'succeeded',
            'failed',
            'cancelled',
            'timed_out'
          )
          AND ${table.startedAt} IS NOT NULL
          AND ${table.finishedAt} IS NOT NULL
          AND ${table.finishedAt} >= ${table.startedAt}
        )
      `,
    ),

    check(
      'job_runs_failure_details_valid',
      sql`
        (
          ${table.status} = 'failed'
          AND ${table.errorMessage} IS NOT NULL
          AND length(trim(${table.errorMessage})) > 0
        )
        OR
        (
          ${table.status} <> 'failed'
          AND ${table.errorCode} IS NULL
          AND ${table.errorMessage} IS NULL
        )
      `,
    ),

    check(
      'job_runs_timeout_valid',
      sql`
        ${table.status} <> 'timed_out'
        OR ${table.timeoutAt} IS NOT NULL
      `,
    ),

    check(
      'job_runs_lease_consistency',
      sql`
        (
          ${table.claimedBy} IS NULL
          AND ${table.claimedAt} IS NULL
          AND ${table.leaseExpiresAt} IS NULL
        )
        OR
        (
          ${table.claimedBy} IS NOT NULL
          AND ${table.claimedAt} IS NOT NULL
          AND ${table.leaseExpiresAt} IS NOT NULL
          AND ${table.leaseExpiresAt} > ${table.claimedAt}
        )
      `,
    ),
  ],
);

export type JobRun = typeof jobRuns.$inferSelect;

export type NewJobRun = typeof jobRuns.$inferInsert;
