import { describe, expect, it } from 'vitest';

import { validateJobSchedule } from './job-schedule.validation.js';

describe('validateJobSchedule', () => {
  it('accepts a valid once schedule', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).not.toThrow();
  });

  it('rejects once without runAt', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'once',
      }),
    ).toThrow('runAt is required for once schedules');
  });

  it('rejects intervalSeconds for once schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
        intervalSeconds: 60,
      }),
    ).toThrow('intervalSeconds is not allowed for once schedules');
  });

  it('rejects cronExpression for once schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
        cronExpression: '* * * * *',
      }),
    ).toThrow('cronExpression is not allowed for once schedules');
  });

  it('accepts a valid interval schedule', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'interval',
        intervalSeconds: 300,
      }),
    ).not.toThrow();
  });

  it.each([undefined, null, 0, -1, 1.5, Number.NaN])(
    'rejects invalid intervalSeconds value %s',
    (intervalSeconds) => {
      expect(() =>
        validateJobSchedule({
          scheduleType: 'interval',
          intervalSeconds,
        }),
      ).toThrow('intervalSeconds must be an integer greater than 0 for interval schedules');
    },
  );

  it('rejects runAt for interval schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'interval',
        intervalSeconds: 60,
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).toThrow('runAt is not allowed for interval schedules');
  });

  it('rejects cronExpression for interval schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'interval',
        intervalSeconds: 60,
        cronExpression: '* * * * *',
      }),
    ).toThrow('cronExpression is not allowed for interval schedules');
  });

  it('accepts a valid cron schedule', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        timezone: 'Europe/Berlin',
      }),
    ).not.toThrow();
  });

  it.each([undefined, null, '', '   '])(
    'rejects missing cronExpression value %s',
    (cronExpression) => {
      expect(() =>
        validateJobSchedule({
          scheduleType: 'cron',
          cronExpression,
        }),
      ).toThrow('cronExpression is required for cron schedules');
    },
  );

  it.each([
    '0 0 * *',
    '0 0 * * * *',
    '60 * * * *',
    '* 24 * * *',
    '* * 0 * *',
    '* * * 13 *',
    '* * * * 8',
    '*/0 * * * *',
    '10-5 * * * *',
  ])('rejects invalid cron expression %s', (cronExpression) => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression,
        timezone: 'UTC',
      }),
    ).toThrow();
  });

  it('accepts cron lists, ranges and steps', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0,15,30,45 8-18/2 * * 1-5',
        timezone: 'Europe/Berlin',
      }),
    ).not.toThrow();
  });

  it('rejects runAt for cron schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).toThrow('runAt is not allowed for cron schedules');
  });

  it('rejects intervalSeconds for cron schedules', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        intervalSeconds: 60,
      }),
    ).toThrow('intervalSeconds is not allowed for cron schedules');
  });

  it('rejects an invalid runAt date', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'once',
        runAt: new Date('invalid'),
      }),
    ).toThrow('runAt must be a valid date');
  });

  it('accepts a valid IANA timezone', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        timezone: 'Europe/Berlin',
      }),
    ).not.toThrow();
  });

  it('rejects an empty timezone', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        timezone: '   ',
      }),
    ).toThrow('timezone must not be empty');
  });

  it('rejects an invalid timezone', () => {
    expect(() =>
      validateJobSchedule({
        scheduleType: 'cron',
        cronExpression: '0 4 * * *',
        timezone: 'Not/A-Timezone',
      }),
    ).toThrow('timezone must be a valid IANA timezone');
  });
});
