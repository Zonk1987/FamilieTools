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

  it('rejects cron calculation until cron support is implemented', () => {
    expect(() =>
      computeNextRunAt(
        {
          ...baseSchedule,
          scheduleType: 'cron',
          runAt: null,
          intervalSeconds: null,
          cronExpression: '*/5 * * * *',
        },
        new Date('2026-09-24T18:00:00.000Z'),
      ),
    ).toThrow('Cron schedule calculation is not implemented yet');
  });
});
