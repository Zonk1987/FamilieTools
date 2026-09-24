import { describe, expect, it } from 'vitest';

import type { JobSchedule } from '../database/schema/index.js';
import { computeNextRunAt } from './job-schedule.next-run.js';

const baseSchedule: JobSchedule = {
  id: '11111111-1111-4111-8111-111111111111',

  jobDefinitionId: '22222222-2222-4222-8222-222222222222',

  scheduleType: 'once',

  runAt: new Date('2026-09-24T18:00:00.000Z'),

  intervalSeconds: null,
  cronExpression: null,

  timezone: 'UTC',

  nextRunAt: new Date('2026-09-24T18:00:00.000Z'),

  lastRunAt: null,

  isEnabled: true,

  metadata: {},

  createdAt: new Date('2026-09-24T17:00:00.000Z'),

  updatedAt: new Date('2026-09-24T17:00:00.000Z'),
};

describe('computeNextRunAt', () => {
  it('returns null for a once schedule', () => {
    const scheduledFor = new Date('2026-09-24T18:00:00.000Z');

    expect(computeNextRunAt(baseSchedule, scheduledFor)).toBeNull();
  });

  it('calculates the next interval execution from scheduledFor', () => {
    const scheduledFor = new Date('2026-09-24T18:00:00.000Z');

    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'interval',
        runAt: null,
        intervalSeconds: 300,
      },
      scheduledFor,
    );

    expect(nextRunAt?.toISOString()).toBe('2026-09-24T18:05:00.000Z');
  });

  it('uses scheduledFor instead of the current clock time', () => {
    const scheduledFor = new Date('2026-09-24T18:00:00.000Z');

    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'interval',
        runAt: null,
        intervalSeconds: 60,
      },
      scheduledFor,
    );

    expect(nextRunAt?.toISOString()).toBe('2026-09-24T18:01:00.000Z');
  });

  it.each([0, -1])('rejects invalid intervalSeconds %s', (intervalSeconds) => {
    expect(() =>
      computeNextRunAt(
        {
          ...baseSchedule,
          scheduleType: 'interval',
          runAt: null,
          intervalSeconds,
        },
        new Date('2026-09-24T18:00:00.000Z'),
      ),
    ).toThrow('Interval schedule requires a positive intervalSeconds value');
  });

  it('calculates the next cron occurrence in UTC', () => {
    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'cron',
        runAt: null,
        intervalSeconds: null,
        cronExpression: '*/5 * * * *',
        timezone: 'UTC',
      },
      new Date('2026-09-24T18:00:00.000Z'),
    );

    expect(nextRunAt?.toISOString()).toBe('2026-09-24T18:05:00.000Z');
  });

  it('respects the configured IANA timezone', () => {
    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'cron',
        runAt: null,
        intervalSeconds: null,
        cronExpression: '0 4 * * *',
        timezone: 'Europe/Berlin',
      },
      new Date('2026-09-24T01:59:00.000Z'),
    );

    expect(nextRunAt?.toISOString()).toBe('2026-09-24T02:00:00.000Z');
  });

  it('handles daylight-saving transitions without inventing nonexistent local times', () => {
    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'cron',
        runAt: null,
        intervalSeconds: null,
        cronExpression: '30 2 * * *',
        timezone: 'Europe/Berlin',
      },
      new Date('2026-03-28T01:30:00.000Z'),
    );

    expect(nextRunAt?.toISOString()).toBe('2026-03-30T00:30:00.000Z');
  });

  it('uses cron day-of-month OR day-of-week semantics when both are restricted', () => {
    const nextRunAt = computeNextRunAt(
      {
        ...baseSchedule,
        scheduleType: 'cron',
        runAt: null,
        intervalSeconds: null,
        cronExpression: '0 9 1 * 1',
        timezone: 'UTC',
      },
      new Date('2026-09-27T09:00:00.000Z'),
    );

    expect(nextRunAt?.toISOString()).toBe('2026-09-28T09:00:00.000Z');
  });

  it('rejects a cron schedule without an expression', () => {
    expect(() =>
      computeNextRunAt(
        {
          ...baseSchedule,
          scheduleType: 'cron',
          runAt: null,
          intervalSeconds: null,
          cronExpression: null,
        },
        new Date('2026-09-24T18:00:00.000Z'),
      ),
    ).toThrow('Cron schedule requires a cronExpression');
  });
});
