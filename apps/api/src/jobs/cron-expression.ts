const FIELD_COUNT = 5;
const MAX_SEARCH_MINUTES = 5 * 366 * 24 * 60;

type CronField = {
  values: Set<number>;
  wildcard: boolean;
};

export type ParsedCronExpression = {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
};

type CronFieldOptions = {
  name: string;
  min: number;
  max: number;
  normalize?: (value: number) => number;
};

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function parsePositiveInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be an integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} is out of range`);
  }

  return parsed;
}

function addRange(
  target: Set<number>,
  start: number,
  end: number,
  step: number,
  options: CronFieldOptions,
): void {
  if (start < options.min || start > options.max || end < options.min || end > options.max) {
    throw new Error(`${options.name} values must be between ${options.min} and ${options.max}`);
  }

  if (start > end) {
    throw new Error(`${options.name} range start must not be greater than range end`);
  }

  for (let value = start; value <= end; value += step) {
    target.add(options.normalize ? options.normalize(value) : value);
  }
}

function parseCronField(source: string, options: CronFieldOptions): CronField {
  const values = new Set<number>();
  const wildcard = source === '*';

  for (const item of source.split(',')) {
    if (!item) {
      throw new Error(`${options.name} contains an empty list item`);
    }

    const slashParts = item.split('/');

    if (slashParts.length > 2) {
      throw new Error(`${options.name} contains an invalid step`);
    }

    const base = slashParts[0] ?? '';
    const step =
      slashParts[1] === undefined ? 1 : parsePositiveInteger(slashParts[1], options.name);

    if (step <= 0) {
      throw new Error(`${options.name} step must be greater than 0`);
    }

    if (base === '*') {
      addRange(values, options.min, options.max, step, options);
      continue;
    }

    const rangeParts = base.split('-');

    if (rangeParts.length === 2) {
      const start = parsePositiveInteger(rangeParts[0] ?? '', options.name);
      const end = parsePositiveInteger(rangeParts[1] ?? '', options.name);

      addRange(values, start, end, step, options);
      continue;
    }

    if (rangeParts.length > 2) {
      throw new Error(`${options.name} contains an invalid range`);
    }

    if (slashParts[1] !== undefined) {
      const start = parsePositiveInteger(base, options.name);

      addRange(values, start, options.max, step, options);
      continue;
    }

    const value = parsePositiveInteger(base, options.name);

    addRange(values, value, value, 1, options);
  }

  return {
    values,
    wildcard,
  };
}

export function parseCronExpression(expression: string): ParsedCronExpression {
  const normalized = expression.trim();
  const fields = normalized.split(/\s+/);

  if (fields.length !== FIELD_COUNT) {
    throw new Error('cronExpression must contain exactly 5 fields');
  }

  return {
    minute: parseCronField(fields[0] ?? '', {
      name: 'minute',
      min: 0,
      max: 59,
    }),
    hour: parseCronField(fields[1] ?? '', {
      name: 'hour',
      min: 0,
      max: 23,
    }),
    dayOfMonth: parseCronField(fields[2] ?? '', {
      name: 'dayOfMonth',
      min: 1,
      max: 31,
    }),
    month: parseCronField(fields[3] ?? '', {
      name: 'month',
      min: 1,
      max: 12,
    }),
    dayOfWeek: parseCronField(fields[4] ?? '', {
      name: 'dayOfWeek',
      min: 0,
      max: 7,
      normalize: (value) => (value === 7 ? 0 : value),
    }),
  };
}

function getFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timezone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
    timeZone: timezone,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  formatterCache.set(timezone, formatter);

  return formatter;
}

function getLocalParts(
  date: Date,
  timezone: string,
): {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
} {
  const parts = getFormatter(timezone).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  const weekday = values.get('weekday');

  if (!weekday || WEEKDAY_MAP[weekday] === undefined) {
    throw new Error('Could not determine weekday for cron calculation');
  }

  return {
    minute: Number(values.get('minute')),
    hour: Number(values.get('hour')),
    dayOfMonth: Number(values.get('day')),
    month: Number(values.get('month')),
    dayOfWeek: WEEKDAY_MAP[weekday],
  };
}

function matchesCron(parsed: ParsedCronExpression, date: Date, timezone: string): boolean {
  const local = getLocalParts(date, timezone);

  if (!parsed.minute.values.has(local.minute)) {
    return false;
  }

  if (!parsed.hour.values.has(local.hour)) {
    return false;
  }

  if (!parsed.month.values.has(local.month)) {
    return false;
  }

  const dayOfMonthMatches = parsed.dayOfMonth.values.has(local.dayOfMonth);
  const dayOfWeekMatches = parsed.dayOfWeek.values.has(local.dayOfWeek);

  if (!parsed.dayOfMonth.wildcard && !parsed.dayOfWeek.wildcard) {
    return dayOfMonthMatches || dayOfWeekMatches;
  }

  if (!parsed.dayOfMonth.wildcard && !dayOfMonthMatches) {
    return false;
  }

  if (!parsed.dayOfWeek.wildcard && !dayOfWeekMatches) {
    return false;
  }

  return true;
}

export function findNextCronRun(expression: string, timezone: string, after: Date): Date {
  const parsed = parseCronExpression(expression);

  // Start at the next whole minute. Cron v1 intentionally uses standard
  // five-field minute precision.
  const candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  for (let checked = 0; checked < MAX_SEARCH_MINUTES; checked += 1) {
    if (matchesCron(parsed, candidate, timezone)) {
      return new Date(candidate);
    }

    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('Could not find the next cron occurrence within 5 years');
}
