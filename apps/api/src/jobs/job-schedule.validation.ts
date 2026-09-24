export type JobScheduleType = 'once' | 'interval' | 'cron';

export type JobScheduleValidationInput = {
  scheduleType: JobScheduleType;
  runAt?: Date | null;
  intervalSeconds?: number | null;
  cronExpression?: string | null;
  timezone?: string | null;
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateDate(value: Date | null | undefined, fieldName: string): void {
  if (value !== null && value !== undefined && Number.isNaN(value.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
}

function validateTimezone(timezone: string | null | undefined): void {
  if (timezone === null || timezone === undefined) {
    return;
  }

  const normalized = timezone.trim();

  if (!normalized) {
    throw new Error('timezone must not be empty');
  }

  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: normalized,
    });
  } catch {
    throw new Error('timezone must be a valid IANA timezone');
  }
}

export function validateJobSchedule(input: JobScheduleValidationInput): void {
  validateDate(input.runAt, 'runAt');

  validateTimezone(input.timezone);

  if (input.scheduleType === 'once') {
    if (!input.runAt) {
      throw new Error('runAt is required for once schedules');
    }

    if (input.intervalSeconds !== null && input.intervalSeconds !== undefined) {
      throw new Error('intervalSeconds is not allowed for once schedules');
    }

    if (hasValue(input.cronExpression)) {
      throw new Error('cronExpression is not allowed for once schedules');
    }

    return;
  }

  if (input.scheduleType === 'interval') {
    if (!Number.isInteger(input.intervalSeconds) || (input.intervalSeconds ?? 0) <= 0) {
      throw new Error('intervalSeconds must be an integer greater than 0 for interval schedules');
    }

    if (input.runAt) {
      throw new Error('runAt is not allowed for interval schedules');
    }

    if (hasValue(input.cronExpression)) {
      throw new Error('cronExpression is not allowed for interval schedules');
    }

    return;
  }

  if (input.scheduleType === 'cron') {
    if (!hasValue(input.cronExpression)) {
      throw new Error('cronExpression is required for cron schedules');
    }

    if (input.runAt) {
      throw new Error('runAt is not allowed for cron schedules');
    }

    if (input.intervalSeconds !== null && input.intervalSeconds !== undefined) {
      throw new Error('intervalSeconds is not allowed for cron schedules');
    }

    return;
  }

  const exhaustiveCheck: never = input.scheduleType;

  throw new Error(`Unsupported schedule type: ${String(exhaustiveCheck)}`);
}
