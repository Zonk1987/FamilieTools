import { Injectable } from '@nestjs/common';

import type { DatabaseExecutor } from '../database/database.service.js';
import {
  AuditRepository,
  type AuditLogListResult,
  type AuditLogRecord,
} from './audit.repository.js';

export type AuditResult = 'success' | 'failure' | 'denied';

export type AuditActor = {
  type: string;
  id?: string | null;
};

export type AuditScope = {
  type: string;
  id?: string | null;
};

export type AuditTarget = {
  type: string;
  id?: string | null;
};

export type AppendAuditEventInput = {
  actor: AuditActor;
  action: string;
  result: AuditResult;

  scope?: AuditScope | null;
  target?: AuditTarget | null;

  requestId?: string | null;

  metadata?: Record<string, unknown>;
};

export type ListAuditEventsInput = {
  page?: number;
  pageSize?: number;

  action?: string;
  result?: AuditResult;

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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const SENSITIVE_METADATA_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'sessionToken',
  'authorization',
  'cookie',
  'setCookie',
  'apiKey',
  'secret',
  'clientSecret',
  'privateKey',
]);

function normalizeRequiredIdentifier(value: string, name: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${name} must not be empty`);
  }

  return normalized;
}

function normalizeOptionalIdentifier(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeOptionalFilter(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item));
  }

  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_METADATA_KEYS.has(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      sanitized[key] = sanitizeMetadataValue(nestedValue);
    }

    return sanitized;
  }

  return value;
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  return sanitizeMetadataValue(metadata) as Record<string, unknown>;
}

function normalizePage(page: number | undefined): number {
  if (page === undefined) {
    return DEFAULT_PAGE;
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new Error('page must be an integer greater than or equal to 1');
  }

  return page;
}

function normalizePageSize(pageSize: number | undefined): number {
  if (pageSize === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }

  return pageSize;
}

function validateDateRange(createdFrom: Date | undefined, createdTo: Date | undefined): void {
  if (createdFrom && Number.isNaN(createdFrom.getTime())) {
    throw new Error('createdFrom must be a valid date');
  }

  if (createdTo && Number.isNaN(createdTo.getTime())) {
    throw new Error('createdTo must be a valid date');
  }

  if (createdFrom && createdTo && createdFrom > createdTo) {
    throw new Error('createdFrom must not be after createdTo');
  }
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async append(input: AppendAuditEventInput, database?: DatabaseExecutor): Promise<AuditLogRecord> {
    const actorType = normalizeRequiredIdentifier(input.actor.type, 'actor.type');

    const action = normalizeRequiredIdentifier(input.action, 'action');

    const scopeType = input.scope
      ? normalizeRequiredIdentifier(input.scope.type, 'scope.type')
      : null;

    const targetType = input.target
      ? normalizeRequiredIdentifier(input.target.type, 'target.type')
      : null;

    return this.auditRepository.append(
      {
        actorType,
        actorId: normalizeOptionalIdentifier(input.actor.id),

        scopeType,
        scopeId: normalizeOptionalIdentifier(input.scope?.id),

        action,

        targetType,
        targetId: normalizeOptionalIdentifier(input.target?.id),

        result: input.result,

        requestId: normalizeOptionalIdentifier(input.requestId),

        metadata: sanitizeMetadata(input.metadata),
      },
      database,
    );
  }

  async list(
    input: ListAuditEventsInput = {},
    database?: DatabaseExecutor,
  ): Promise<AuditLogListResult> {
    validateDateRange(input.createdFrom, input.createdTo);

    return this.auditRepository.list(
      {
        page: normalizePage(input.page),
        pageSize: normalizePageSize(input.pageSize),

        action: normalizeOptionalFilter(input.action),

        result: input.result,

        actorType: normalizeOptionalFilter(input.actorType),

        actorId: normalizeOptionalFilter(input.actorId),

        scopeType: normalizeOptionalFilter(input.scopeType),

        scopeId: normalizeOptionalFilter(input.scopeId),

        targetType: normalizeOptionalFilter(input.targetType),

        targetId: normalizeOptionalFilter(input.targetId),

        requestId: normalizeOptionalFilter(input.requestId),

        createdFrom: input.createdFrom,
        createdTo: input.createdTo,
      },
      database,
    );
  }
}
