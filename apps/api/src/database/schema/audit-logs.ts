import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const auditResult = pgEnum('audit_result', ['success', 'failure', 'denied']);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    actorType: text('actor_type').notNull(),

    actorId: text('actor_id'),

    scopeType: text('scope_type'),

    scopeId: uuid('scope_id'),

    action: text('action').notNull(),

    targetType: text('target_type'),

    targetId: text('target_id'),

    result: auditResult('result').notNull(),

    requestId: text('request_id'),

    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_created_at_idx').on(table.createdAt),

    index('audit_logs_actor_idx').on(table.actorType, table.actorId),

    index('audit_logs_scope_idx').on(table.scopeType, table.scopeId),

    index('audit_logs_action_idx').on(table.action),
  ],
);
