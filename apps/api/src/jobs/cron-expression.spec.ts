import { describe, expect, it } from 'vitest';

import { findNextCronRun, parseCronExpression } from './cron-expression.js';

describe('cron-expression', () => {
  it('parses standard five-field expressions', () => {
    const parsed = parseCronExpression('*/15 8-18/2 * * 1-5');

    expect(parsed.minute.values.has(0)).toBe(true);
    expect(parsed.minute.values.has(15)).toBe(true);
    expect(parsed.hour.values.has(8)).toBe(true);
    expect(parsed.hour.values.has(10)).toBe(true);
    expect(parsed.dayOfWeek.values.has(1)).toBe(true);
    expect(parsed.dayOfWeek.values.has(5)).toBe(true);
  });

  it('treats day-of-week 7 as Sunday', () => {
    const next = findNextCronRun('0 10 * * 7', 'UTC', new Date('2026-09-26T10:00:00.000Z'));

    expect(next.toISOString()).toBe('2026-09-27T10:00:00.000Z');
  });

  it('supports comma-separated values', () => {
    const next = findNextCronRun('10,20,30 * * * *', 'UTC', new Date('2026-09-24T18:10:00.000Z'));

    expect(next.toISOString()).toBe('2026-09-24T18:20:00.000Z');
  });

  it('rejects expressions with the wrong number of fields', () => {
    expect(() => parseCronExpression('* * * *')).toThrow(
      'cronExpression must contain exactly 5 fields',
    );
  });
});
