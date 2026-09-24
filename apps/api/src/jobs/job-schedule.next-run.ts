import type { JobSchedule } from '../database/schema/index.js';
import { findNextCronRun } from './cron-expression.js';

export function computeNextRunAt(schedule: JobSchedule, scheduledFor: Date): Date | null {
  if (schedule.scheduleType === 'once') {
    return null;
  }

  if (schedule.scheduleType === 'interval') {
    if (schedule.intervalSeconds === null || schedule.intervalSeconds <= 0) {
      throw new Error('Interval schedule requires a positive intervalSeconds value');
    }

    return new Date(scheduledFor.getTime() + schedule.intervalSeconds * 1000);
  }

  if (schedule.scheduleType === 'cron') {
    if (!schedule.cronExpression) {
      throw new Error('Cron schedule requires a cronExpression');
    }

    if (!schedule.timezone.trim()) {
      throw new Error('Cron schedule requires a timezone');
    }

    return findNextCronRun(schedule.cronExpression, schedule.timezone, scheduledFor);
  }

  const exhaustiveCheck: never = schedule.scheduleType;

  throw new Error(`Unsupported schedule type: ${String(exhaustiveCheck)}`);
}
