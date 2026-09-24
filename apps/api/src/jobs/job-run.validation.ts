export type JobRunStatus =
  'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';

export type JobRunTriggerType = 'manual' | 'schedule' | 'event' | 'system';

export type JobRunValidationInput = {
  status: JobRunStatus;
  triggerType: JobRunTriggerType;

  attempt?: number | null;

  scheduleId?: string | null;

  startedAt?: Date | null;
  finishedAt?: Date | null;
  timeoutAt?: Date | null;
  scheduledFor?: Date | null;

  errorCode?: string | null;
  errorMessage?: string | null;
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateDate(value: Date | null | undefined, fieldName: string): void {
  if (value !== null && value !== undefined && Number.isNaN(value.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
}

export function validateJobRun(input: JobRunValidationInput): void {
  const attempt = input.attempt ?? 1;

  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new Error('attempt must be an integer greater than or equal to 1');
  }

  validateDate(input.startedAt, 'startedAt');

  validateDate(input.finishedAt, 'finishedAt');

  validateDate(input.timeoutAt, 'timeoutAt');

  if (input.triggerType === 'schedule') {
    if (!input.scheduledFor) {
      throw new Error('scheduledFor is required for schedule-triggered runs');
    }

    if (!hasValue(input.scheduleId)) {
      throw new Error('scheduleId is required for schedule-triggered runs');
    }
  } else if (hasValue(input.scheduleId)) {
    if (input.scheduledFor) {
      throw new Error('scheduledFor is only allowed for schedule-triggered runs');
    }
    throw new Error('scheduleId is only allowed for schedule-triggered runs');
  }

  if (input.status === 'queued') {
    if (input.startedAt) {
      throw new Error('startedAt is not allowed for queued runs');
    }

    if (input.finishedAt) {
      throw new Error('finishedAt is not allowed for queued runs');
    }
  }

  if (input.status === 'running') {
    if (!input.startedAt) {
      throw new Error('startedAt is required for running runs');
    }

    if (input.finishedAt) {
      throw new Error('finishedAt is not allowed for running runs');
    }
  }

  const isFinal =
    input.status === 'succeeded' ||
    input.status === 'failed' ||
    input.status === 'cancelled' ||
    input.status === 'timed_out';

  if (isFinal) {
    if (!input.startedAt) {
      throw new Error('startedAt is required for completed runs');
    }

    if (!input.finishedAt) {
      throw new Error('finishedAt is required for completed runs');
    }

    if (input.finishedAt < input.startedAt) {
      throw new Error('finishedAt must not be before startedAt');
    }
  }

  if (input.status === 'failed' && !hasValue(input.errorMessage)) {
    throw new Error('errorMessage is required for failed runs');
  }

  if (input.status !== 'failed' && (hasValue(input.errorCode) || hasValue(input.errorMessage))) {
    throw new Error('error details are only allowed for failed runs');
  }

  if (input.status === 'timed_out' && !input.timeoutAt) {
    throw new Error('timeoutAt is required for timed out runs');
  }
}
