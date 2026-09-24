import type { JobSchedule } from '../database/schema/index.js';

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
    throw new Error('Cron schedule calculation is not implemented yet');
  }

  const exhaustiveCheck: never = schedule.scheduleType;

  throw new Error(`Unsupported schedule type: ${String(exhaustiveCheck)}`);
}
