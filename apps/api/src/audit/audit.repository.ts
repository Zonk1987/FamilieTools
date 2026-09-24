import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';

import { DatabaseService, type DatabaseExecutor } from '../database/database.service.js';
import { auditLogs } from '../database/schema/audit-logs.js';

export type AuditLogRecord = typeof auditLogs.$inferSelect;

type NewAuditLogRecord = typeof auditLogs.$inferInsert;

export type AuditLogListInput = {
  page: number;
  pageSize: number;

  action?: string;
  result?: AuditLogRecord['result'];

  actorType?: string;
  actorId?: string;

  scopeType?: string;
  scopeId?: string;

  targetType?: string;
  targetId?: string;

  requestId?: string;

  createdFrom?: Date;
  createdTo?: Date;
};

export type AuditLogListResult = {
  items: AuditLogRecord[];
  page: number;
  pageSize: number;
  total: number;
};

@Injectable()
export class AuditRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async append(
    data: NewAuditLogRecord,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<AuditLogRecord> {
    const [entry] = await database.insert(auditLogs).values(data).returning();

    if (!entry) {
      throw new Error('Failed to append audit log entry');
    }

    return entry;
  }

  async list(
    input: AuditLogListInput,
    database: DatabaseExecutor = this.databaseService.db,
  ): Promise<AuditLogListResult> {
    const conditions: SQL[] = [];

    if (input.action) {
      conditions.push(eq(auditLogs.action, input.action));
    }

    if (input.result) {
      conditions.push(eq(auditLogs.result, input.result));
    }

    if (input.actorType) {
      conditions.push(eq(auditLogs.actorType, input.actorType));
    }

    if (input.actorId) {
      conditions.push(eq(auditLogs.actorId, input.actorId));
    }

    if (input.scopeType) {
      conditions.push(eq(auditLogs.scopeType, input.scopeType));
    }

    if (input.scopeId) {
      conditions.push(eq(auditLogs.scopeId, input.scopeId));
    }

    if (input.targetType) {
      conditions.push(eq(auditLogs.targetType, input.targetType));
    }

    if (input.targetId) {
      conditions.push(eq(auditLogs.targetId, input.targetId));
    }

    if (input.requestId) {
      conditions.push(eq(auditLogs.requestId, input.requestId));
    }

    if (input.createdFrom) {
      conditions.push(gte(auditLogs.createdAt, input.createdFrom));
    }

    if (input.createdTo) {
      conditions.push(lte(auditLogs.createdAt, input.createdTo));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (input.page - 1) * input.pageSize;

    const [items, totalRows] = await Promise.all([
      database
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(input.pageSize)
        .offset(offset),

      database
        .select({
          count: count(),
        })
        .from(auditLogs)
        .where(where),
    ]);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: totalRows[0]?.count ?? 0,
    };
  }
}
