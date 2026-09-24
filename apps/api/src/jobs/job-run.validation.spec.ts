import { describe, expect, it } from 'vitest';

import { validateJobRun } from './job-run.validation.js';

const startedAt = new Date('2026-09-24T12:00:00.000Z');

const finishedAt = new Date('2026-09-24T12:05:00.000Z');

describe('validateJobRun', () => {
  it('accepts a queued manual run', () => {
    expect(() =>
      validateJobRun({
        status: 'queued',
        triggerType: 'manual',
      }),
    ).not.toThrow();
  });

  it('accepts a running run', () => {
    expect(() =>
      validateJobRun({
        status: 'running',
        triggerType: 'manual',
        startedAt,
      }),
    ).not.toThrow();
  });

  it('accepts a succeeded run', () => {
    expect(() =>
      validateJobRun({
        status: 'succeeded',
        triggerType: 'manual',
        startedAt,
        finishedAt,
      }),
    ).not.toThrow();
  });

  it('accepts a failed run with error details', () => {
    expect(() =>
      validateJobRun({
        status: 'failed',
        triggerType: 'manual',
        startedAt,
        finishedAt,
        errorCode: 'JOB_FAILED',
        errorMessage: 'The job failed.',
      }),
    ).not.toThrow();
  });

  it('accepts a timed out run', () => {
    expect(() =>
      validateJobRun({
        status: 'timed_out',
        triggerType: 'system',
        startedAt,
        finishedAt,
        timeoutAt: finishedAt,
      }),
    ).not.toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid attempt value %s', (attempt) => {
    expect(() =>
      validateJobRun({
        status: 'queued',
        triggerType: 'manual',
        attempt,
      }),
    ).toThrow('attempt must be an integer greater than or equal to 1');
  });

  it('requires scheduleId for schedule-triggered runs', () => {
    expect(() =>
      validateJobRun({
        status: 'queued',
        triggerType: 'schedule',
      }),
    ).toThrow('scheduleId is required for schedule-triggered runs');
  });

  it('rejects scheduleId for non-schedule triggers', () => {
    expect(() =>
      validateJobRun({
        status: 'queued',
        triggerType: 'manual',
        scheduleId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toThrow('scheduleId is only allowed for schedule-triggered runs');
  });

  it('rejects startedAt for queued runs', () => {
    expect(() =>
      validateJobRun({
        status: 'queued',
        triggerType: 'manual',
        startedAt,
      }),
    ).toThrow('startedAt is not allowed for queued runs');
  });

  it('requires startedAt for running runs', () => {
    expect(() =>
      validateJobRun({
        status: 'running',
        triggerType: 'manual',
      }),
    ).toThrow('startedAt is required for running runs');
  });

  it('rejects finishedAt for running runs', () => {
    expect(() =>
      validateJobRun({
        status: 'running',
        triggerType: 'manual',
        startedAt,
        finishedAt,
      }),
    ).toThrow('finishedAt is not allowed for running runs');
  });

  it.each(['succeeded', 'failed', 'cancelled', 'timed_out'] as const)(
    'requires timestamps for final status %s',
    (status) => {
      expect(() =>
        validateJobRun({
          status,
          triggerType: 'manual',
        }),
      ).toThrow('startedAt is required for completed runs');
    },
  );

  it('rejects finishedAt before startedAt', () => {
    expect(() =>
      validateJobRun({
        status: 'succeeded',
        triggerType: 'manual',
        startedAt,
        finishedAt: new Date('2026-09-24T11:59:00.000Z'),
      }),
    ).toThrow('finishedAt must not be before startedAt');
  });

  it('requires errorMessage for failed runs', () => {
    expect(() =>
      validateJobRun({
        status: 'failed',
        triggerType: 'manual',
        startedAt,
        finishedAt,
      }),
    ).toThrow('errorMessage is required for failed runs');
  });

  it('rejects error details for successful runs', () => {
    expect(() =>
      validateJobRun({
        status: 'succeeded',
        triggerType: 'manual',
        startedAt,
        finishedAt,
        errorMessage: 'Should not be present',
      }),
    ).toThrow('error details are only allowed for failed runs');
  });

  it('requires timeoutAt for timed out runs', () => {
    expect(() =>
      validateJobRun({
        status: 'timed_out',
        triggerType: 'system',
        startedAt,
        finishedAt,
      }),
    ).toThrow('timeoutAt is required for timed out runs');
  });

  it('rejects invalid dates', () => {
    expect(() =>
      validateJobRun({
        status: 'running',
        triggerType: 'manual',
        startedAt: new Date('invalid'),
      }),
    ).toThrow('startedAt must be a valid date');
  });
});
