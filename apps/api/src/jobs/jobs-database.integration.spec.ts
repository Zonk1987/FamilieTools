import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRepository } from './job.repository.js';
import { AppModule } from '../app.module.js';
import { configureApp } from '../app.configure.js';
import { DatabaseService } from '../database/database.service.js';
import { jobDefinitions, jobRuns, jobSchedules } from '../database/schema/index.js';

describe('Jobs database constraints', () => {
  let app: NestFastifyApplication;
  let database: DatabaseService;
  let repository: JobRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await configureApp(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    database = app.get(DatabaseService);
    repository = app.get(JobRepository);

    await database.db.delete(jobRuns);

    await database.db.delete(jobSchedules);

    await database.db.delete(jobDefinitions);
  });

  afterAll(async () => {
    if (database) {
      await database.db.delete(jobRuns);

      await database.db.delete(jobSchedules);

      await database.db.delete(jobDefinitions);
    }

    if (app) {
      await app.close();
    }
  });

  it('accepts a valid platform job definition', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'system.cleanup',
        ownerType: 'platform',
        ownerId: null,
        name: 'System Cleanup',
        handler: 'system.cleanup',
      })
      .returning();

    expect(job).toEqual(
      expect.objectContaining({
        key: 'system.cleanup',
        ownerType: 'platform',
        ownerId: null,
      }),
    );
  });

  it('rejects a platform job definition with ownerId', async () => {
    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'invalid.platform.owner',
        ownerType: 'platform',
        ownerId: '11111111-1111-4111-8111-111111111111',
        name: 'Invalid Platform Job',
        handler: 'invalid.platform.owner',
      }),
    ).rejects.toThrow();
  });

  it('rejects a scoped job definition without ownerId', async () => {
    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'workspace.cleanup',
        ownerType: 'workspace',
        ownerId: null,
        name: 'Workspace Cleanup',
        handler: 'workspace.cleanup',
      }),
    ).rejects.toThrow();
  });

  it('rejects non-positive default timeout', async () => {
    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'invalid.timeout',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Timeout',
        handler: 'invalid.timeout',
        defaultTimeoutSeconds: 0,
      }),
    ).rejects.toThrow();
  });

  it('rejects negative max retries', async () => {
    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'invalid.retries',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Retries',
        handler: 'invalid.retries',
        maxRetries: -1,
      }),
    ).rejects.toThrow();
  });

  it('rejects negative retry delay', async () => {
    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'invalid.retry-delay',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Retry Delay',
        handler: 'invalid.retry-delay',
        retryDelaySeconds: -1,
      }),
    ).rejects.toThrow();
  });

  it('rejects duplicate platform job keys', async () => {
    await database.db.insert(jobDefinitions).values({
      key: 'duplicate.platform',
      ownerType: 'platform',
      ownerId: null,
      name: 'Duplicate Platform 1',
      handler: 'duplicate.platform.one',
    });

    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'duplicate.platform',
        ownerType: 'platform',
        ownerId: null,
        name: 'Duplicate Platform 2',
        handler: 'duplicate.platform.two',
      }),
    ).rejects.toThrow();
  });

  it('rejects duplicate scoped job keys for the same owner', async () => {
    const ownerId = '22222222-2222-4222-8222-222222222222';

    await database.db.insert(jobDefinitions).values({
      key: 'duplicate.workspace',
      ownerType: 'workspace',
      ownerId,
      name: 'Workspace Job 1',
      handler: 'workspace.job.one',
    });

    await expect(
      database.db.insert(jobDefinitions).values({
        key: 'duplicate.workspace',
        ownerType: 'workspace',
        ownerId,
        name: 'Workspace Job 2',
        handler: 'workspace.job.two',
      }),
    ).rejects.toThrow();
  });

  it('allows the same scoped job key for different owners', async () => {
    await database.db.insert(jobDefinitions).values([
      {
        key: 'shared.key',
        ownerType: 'workspace',
        ownerId: '33333333-3333-4333-8333-333333333333',
        name: 'Workspace A',
        handler: 'workspace.shared',
      },
      {
        key: 'shared.key',
        ownerType: 'workspace',
        ownerId: '44444444-4444-4444-8444-444444444444',
        name: 'Workspace B',
        handler: 'workspace.shared',
      },
    ]);
  });

  it('accepts a valid once schedule', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.once',
        ownerType: 'platform',
        ownerId: null,
        name: 'Once Job',
        handler: 'schedule.once',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      })
      .returning();

    expect(schedule).toEqual(
      expect.objectContaining({
        scheduleType: 'once',
      }),
    );
  });

  it('rejects once schedule without runAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.once.invalid',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Once Job',
        handler: 'schedule.once.invalid',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobSchedules).values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
      }),
    ).rejects.toThrow();
  });

  it('rejects interval schedule with invalid interval', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.interval.invalid',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Interval Job',
        handler: 'schedule.interval.invalid',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobSchedules).values({
        jobDefinitionId: job.id,
        scheduleType: 'interval',
        intervalSeconds: 0,
      }),
    ).rejects.toThrow();
  });

  it('rejects cron schedule without cron expression', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.cron.invalid',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Cron Job',
        handler: 'schedule.cron.invalid',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobSchedules).values({
        jobDefinitionId: job.id,
        scheduleType: 'cron',
      }),
    ).rejects.toThrow();
  });

  it('sets scheduleId to null when a schedule is deleted', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.history',
        ownerType: 'platform',
        ownerId: null,
        name: 'History Job',
        handler: 'schedule.history',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create schedule');
    }

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,
        scheduleId: schedule.id,

        scheduledFor: new Date('2026-10-01T12:00:00.000Z'),

        triggerType: 'schedule',

        status: 'succeeded',

        startedAt: new Date('2026-10-01T12:00:00.000Z'),
        finishedAt: new Date('2026-10-01T12:00:01.000Z'),
      })
      .returning({
        id: jobRuns.id,
      });

    if (!run) {
      throw new Error('Failed to create job run');
    }

    await database.db.delete(jobSchedules).where(eq(jobSchedules.id, schedule.id));

    const [storedRun] = await database.db
      .select()
      .from(jobRuns)
      .where(eq(jobRuns.id, run.id))
      .limit(1);

    expect(storedRun).toEqual(
      expect.objectContaining({
        id: run.id,
        scheduleId: null,
      }),
    );
  });

  it('rejects attempt values below 1', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.invalid-attempt',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Attempt Job',
        handler: 'run.invalid-attempt',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        attempt: 0,
      }),
    ).rejects.toThrow();
  });

  it('rejects manual runs with scheduleId', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.manual.schedule-id',
        ownerType: 'platform',
        ownerId: null,
        name: 'Manual Schedule ID Job',
        handler: 'run.manual.schedule-id',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create schedule');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        scheduleId: schedule.id,
      }),
    ).rejects.toThrow();
  });

  it('rejects queued runs with startedAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.queued.started',
        ownerType: 'platform',
        ownerId: null,
        name: 'Queued Started Job',
        handler: 'run.queued.started',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'queued',
        startedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it('rejects running runs without startedAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.running.no-start',
        ownerType: 'platform',
        ownerId: null,
        name: 'Running Without Start',
        handler: 'run.running.no-start',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'running',
      }),
    ).rejects.toThrow();
  });

  it('rejects succeeded runs without finishedAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.success.no-finish',
        ownerType: 'platform',
        ownerId: null,
        name: 'Success Without Finish',
        handler: 'run.success.no-finish',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'succeeded',
        startedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it('rejects final runs with finishedAt before startedAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.invalid-time-order',
        ownerType: 'platform',
        ownerId: null,
        name: 'Invalid Time Order',
        handler: 'run.invalid-time-order',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'succeeded',
        startedAt: new Date('2026-09-24T12:05:00.000Z'),
        finishedAt: new Date('2026-09-24T12:00:00.000Z'),
      }),
    ).rejects.toThrow();
  });

  it('rejects failed runs without errorMessage', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.failed.no-message',
        ownerType: 'platform',
        ownerId: null,
        name: 'Failed Without Message',
        handler: 'run.failed.no-message',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'failed',
        startedAt: new Date('2026-09-24T12:00:00.000Z'),
        finishedAt: new Date('2026-09-24T12:01:00.000Z'),
      }),
    ).rejects.toThrow();
  });

  it('rejects successful runs with error details', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.success.with-error',
        ownerType: 'platform',
        ownerId: null,
        name: 'Success With Error',
        handler: 'run.success.with-error',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'succeeded',
        startedAt: new Date('2026-09-24T12:00:00.000Z'),
        finishedAt: new Date('2026-09-24T12:01:00.000Z'),
        errorMessage: 'This must not exist.',
      }),
    ).rejects.toThrow();
  });

  it('rejects timed out runs without timeoutAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.timeout.no-timeout-at',
        ownerType: 'platform',
        ownerId: null,
        name: 'Timeout Without Timestamp',
        handler: 'run.timeout.no-timeout-at',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    await expect(
      database.db.insert(jobRuns).values({
        jobDefinitionId: job.id,
        triggerType: 'system',
        status: 'timed_out',
        startedAt: new Date('2026-09-24T12:00:00.000Z'),
        finishedAt: new Date('2026-09-24T12:01:00.000Z'),
      }),
    ).rejects.toThrow();
  });

  it('accepts a valid schedule-triggered run', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.schedule.valid',
        ownerType: 'platform',
        ownerId: null,
        name: 'Valid Scheduled Run',
        handler: 'run.schedule.valid',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: new Date('2026-10-01T12:00:00.000Z'),
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create schedule');
    }

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,
        scheduleId: schedule.id,

        scheduledFor: new Date('2026-10-01T12:00:00.000Z'),

        triggerType: 'schedule',
      })
      .returning();

    expect(run).toEqual(
      expect.objectContaining({
        triggerType: 'schedule',
        scheduleId: schedule.id,
        status: 'queued',
        attempt: 1,
      }),
    );
  });

  it('allows exactly one worker to atomically claim a queued run', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.atomic-claim',
        ownerType: 'platform',
        ownerId: null,
        name: 'Atomic Claim Job',
        handler: 'run.atomic-claim',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const claimedAt = new Date('2026-09-24T16:00:00.000Z');

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,
        triggerType: 'manual',
        status: 'queued',
        availableAt: claimedAt,
      })
      .returning({
        id: jobRuns.id,
      });

    if (!run) {
      throw new Error('Failed to create job run');
    }

    const timeoutAt = new Date('2026-09-24T16:05:00.000Z');

    const leaseExpiresAt = new Date('2026-09-24T16:05:00.000Z');

    const [workerAResult, workerBResult] = await Promise.all([
      repository.claimRun(run.id, 'worker-a', claimedAt, timeoutAt, leaseExpiresAt),

      repository.claimRun(run.id, 'worker-b', claimedAt, timeoutAt, leaseExpiresAt),
    ]);

    const successfulClaims = [workerAResult, workerBResult].filter((result) => result !== null);

    expect(successfulClaims).toHaveLength(1);

    const winner = workerAResult ?? workerBResult;

    if (!winner) {
      throw new Error('Expected one worker to claim the run');
    }

    expect(['worker-a', 'worker-b']).toContain(winner.claimedBy);

    expect(winner).toEqual(
      expect.objectContaining({
        id: run.id,
        status: 'running',
        startedAt: claimedAt,
        timeoutAt,
        claimedAt,
        leaseExpiresAt,
      }),
    );

    const loser = workerAResult === null ? workerAResult : workerBResult;

    expect(loser).toBeNull();

    const storedRun = await repository.findRunById(run.id);

    expect(storedRun).not.toBeNull();

    expect(storedRun).toEqual(
      expect.objectContaining({
        id: run.id,
        status: 'running',
        claimedBy: winner.claimedBy,
        startedAt: claimedAt,
        claimedAt,
        timeoutAt,
        leaseExpiresAt,
      }),
    );
  });

  it('recovers a running job with an expired lease', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.expired-lease',
        ownerType: 'platform',
        ownerId: null,
        name: 'Expired Lease Job',
        handler: 'run.expired-lease',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const now = new Date('2026-09-24T18:00:00.000Z');

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,

        triggerType: 'manual',

        status: 'running',

        startedAt: new Date('2026-09-24T17:50:00.000Z'),

        timeoutAt: new Date('2026-09-24T17:55:00.000Z'),

        claimedBy: 'dead-worker',

        claimedAt: new Date('2026-09-24T17:50:00.000Z'),

        leaseExpiresAt: new Date('2026-09-24T17:55:00.000Z'),
      })
      .returning({
        id: jobRuns.id,
      });

    if (!run) {
      throw new Error('Failed to create job run');
    }

    const recovered = await repository.recoverExpiredLeases(now);

    expect(recovered.some((item) => item.id === run.id)).toBe(true);

    const stored = await repository.findRunById(run.id);

    expect(stored).toEqual(
      expect.objectContaining({
        id: run.id,

        status: 'queued',

        startedAt: null,
        timeoutAt: null,

        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,

        finishedAt: null,
        errorCode: null,
        errorMessage: null,
      }),
    );
  });

  it('does not recover a running job with an active lease', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.active-lease',
        ownerType: 'platform',
        ownerId: null,
        name: 'Active Lease Job',
        handler: 'run.active-lease',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const now = new Date('2026-09-24T18:00:00.000Z');

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,

        triggerType: 'manual',

        status: 'running',

        startedAt: new Date('2026-09-24T17:59:00.000Z'),

        timeoutAt: new Date('2026-09-24T18:10:00.000Z'),

        claimedBy: 'active-worker',

        claimedAt: new Date('2026-09-24T17:59:00.000Z'),

        leaseExpiresAt: new Date('2026-09-24T18:10:00.000Z'),
      })
      .returning({
        id: jobRuns.id,
      });

    if (!run) {
      throw new Error('Failed to create job run');
    }

    await repository.recoverExpiredLeases(now);

    const stored = await repository.findRunById(run.id);

    expect(stored).toEqual(
      expect.objectContaining({
        id: run.id,

        status: 'running',

        claimedBy: 'active-worker',
      }),
    );
  });

  it('creates exactly one scheduled run for the same schedule and scheduledFor', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.schedule-dedup',
        ownerType: 'platform',
        ownerId: null,
        name: 'Schedule Dedup Job',
        handler: 'run.schedule-dedup',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const scheduledFor = new Date('2026-10-01T12:00:00.000Z');

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: scheduledFor,
        nextRunAt: scheduledFor,
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create job schedule');
    }

    const [workerAResult, workerBResult] = await Promise.all([
      repository.createScheduledRunIfAbsent({
        jobDefinitionId: job.id,
        scheduleId: schedule.id,
        scheduledFor,
        status: 'queued',
        triggerType: 'schedule',
        attempt: 1,
        input: {},
      }),

      repository.createScheduledRunIfAbsent({
        jobDefinitionId: job.id,
        scheduleId: schedule.id,
        scheduledFor,
        status: 'queued',
        triggerType: 'schedule',
        attempt: 1,
        input: {},
      }),
    ]);

    const createdRuns = [workerAResult, workerBResult].filter((result) => result !== null);

    expect(createdRuns).toHaveLength(1);

    const winner = workerAResult ?? workerBResult;

    expect(winner).not.toBeNull();

    expect(winner).toEqual(
      expect.objectContaining({
        jobDefinitionId: job.id,
        scheduleId: schedule.id,
        scheduledFor,
        status: 'queued',
        triggerType: 'schedule',
      }),
    );

    const storedRuns = await repository.listRunsForDefinition(job.id);

    const matchingRuns = storedRuns.filter(
      (run) =>
        run.scheduleId === schedule.id && run.scheduledFor?.getTime() === scheduledFor.getTime(),
    );

    expect(matchingRuns).toHaveLength(1);
  });

  it('advances a schedule only once for the expected nextRunAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.advance',
        ownerType: 'platform',
        ownerId: null,
        name: 'Schedule Advance Job',
        handler: 'schedule.advance',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const scheduledFor = new Date('2026-10-01T12:00:00.000Z');

    const nextRunAt = new Date('2026-10-01T12:05:00.000Z');

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'interval',
        intervalSeconds: 300,
        nextRunAt: scheduledFor,
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create job schedule');
    }

    const [schedulerA, schedulerB] = await Promise.all([
      repository.advanceSchedule(schedule.id, scheduledFor, scheduledFor, nextRunAt),

      repository.advanceSchedule(schedule.id, scheduledFor, scheduledFor, nextRunAt),
    ]);

    const winners = [schedulerA, schedulerB].filter((result) => result !== null);

    expect(winners).toHaveLength(1);

    const stored = await repository.findScheduleById(schedule.id);

    expect(stored).toEqual(
      expect.objectContaining({
        id: schedule.id,
        isEnabled: true,
        lastRunAt: scheduledFor,
        nextRunAt,
      }),
    );
  });

  it('atomically creates one scheduled run and advances the schedule exactly once', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.atomic-fire',
        ownerType: 'platform',
        ownerId: null,
        name: 'Atomic Scheduled Fire',
        handler: 'schedule.atomic-fire',
      })
      .returning({ id: jobDefinitions.id });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const scheduledFor = new Date('2026-10-02T12:00:00.000Z');
    const nextRunAt = new Date('2026-10-02T12:05:00.000Z');

    const [storedSchedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'interval',
        intervalSeconds: 300,
        nextRunAt: scheduledFor,
      })
      .returning();

    if (!storedSchedule) {
      throw new Error('Failed to create job schedule');
    }

    const [schedulerA, schedulerB] = await Promise.all([
      repository.createScheduledRunAndAdvance(storedSchedule, scheduledFor, nextRunAt),
      repository.createScheduledRunAndAdvance(storedSchedule, scheduledFor, nextRunAt),
    ]);

    const winners = [schedulerA, schedulerB].filter((result) => result !== null);

    expect(winners).toHaveLength(1);

    const storedRuns = await repository.listRunsForDefinition(job.id);
    const matchingRuns = storedRuns.filter(
      (run) =>
        run.scheduleId === storedSchedule.id &&
        run.scheduledFor?.getTime() === scheduledFor.getTime(),
    );

    expect(matchingRuns).toHaveLength(1);

    const advanced = await repository.findScheduleById(storedSchedule.id);

    expect(advanced).toEqual(
      expect.objectContaining({
        id: storedSchedule.id,
        lastRunAt: scheduledFor,
        nextRunAt,
        isEnabled: true,
      }),
    );
  });

  it('rolls back the schedule advance when scheduled run creation fails', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'schedule.atomic-rollback',
        ownerType: 'platform',
        ownerId: null,
        name: 'Atomic Scheduled Rollback',
        handler: 'schedule.atomic-rollback',
      })
      .returning({ id: jobDefinitions.id });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const scheduledFor = new Date('2026-10-03T12:00:00.000Z');
    const nextRunAt = new Date('2026-10-03T12:05:00.000Z');

    const [storedSchedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'interval',
        intervalSeconds: 300,
        nextRunAt: scheduledFor,
      })
      .returning();

    if (!storedSchedule) {
      throw new Error('Failed to create job schedule');
    }

    const invalidSchedule = {
      ...storedSchedule,
      jobDefinitionId: '99999999-9999-4999-8999-999999999999',
    };

    await expect(
      repository.createScheduledRunAndAdvance(invalidSchedule, scheduledFor, nextRunAt),
    ).rejects.toThrow();

    const afterFailure = await repository.findScheduleById(storedSchedule.id);

    expect(afterFailure).toEqual(
      expect.objectContaining({
        id: storedSchedule.id,
        lastRunAt: null,
        nextRunAt: scheduledFor,
        isEnabled: true,
      }),
    );

    const storedRuns = await repository.listRunsForDefinition(job.id);
    const matchingRuns = storedRuns.filter(
      (run) =>
        run.scheduleId === storedSchedule.id &&
        run.scheduledFor?.getTime() === scheduledFor.getTime(),
    );

    expect(matchingRuns).toHaveLength(0);
  });

  it('returns only queued runs whose availableAt is due', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.ready-queue',
        ownerType: 'platform',
        ownerId: null,
        name: 'Ready Queue',
        handler: 'run.ready-queue',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const now = new Date('2026-10-04T12:00:00.000Z');

    const [readyRun, futureRun] = await database.db
      .insert(jobRuns)
      .values([
        {
          jobDefinitionId: job.id,
          triggerType: 'manual',
          status: 'queued',
          availableAt: now,
        },
        {
          jobDefinitionId: job.id,
          triggerType: 'manual',
          status: 'queued',
          availableAt: new Date('2026-10-04T12:05:00.000Z'),
        },
      ])
      .returning();

    if (!readyRun || !futureRun) {
      throw new Error('Failed to create ready queue test runs');
    }

    const ready = await repository.listReadyRuns(now);

    expect(ready.some((run) => run.id === readyRun.id)).toBe(true);

    expect(ready.some((run) => run.id === futureRun.id)).toBe(false);
  });

  it('atomically marks a failed attempt and creates a retry attempt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.retry-chain',
        ownerType: 'platform',
        ownerId: null,
        name: 'Retry Chain',
        handler: 'run.retry-chain',
        maxRetries: 2,
        retryDelaySeconds: 30,
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const scheduledFor = new Date('2026-10-05T12:00:00.000Z');

    const [schedule] = await database.db
      .insert(jobSchedules)
      .values({
        jobDefinitionId: job.id,
        scheduleType: 'once',
        runAt: scheduledFor,
      })
      .returning({
        id: jobSchedules.id,
      });

    if (!schedule) {
      throw new Error('Failed to create schedule');
    }

    const [running] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,

        scheduleId: schedule.id,
        scheduledFor,

        triggerType: 'schedule',

        status: 'running',
        attempt: 1,

        availableAt: scheduledFor,

        startedAt: scheduledFor,

        timeoutAt: new Date('2026-10-05T12:05:00.000Z'),

        claimedBy: 'worker-a',
        claimedAt: scheduledFor,
        leaseExpiresAt: new Date('2026-10-05T12:05:00.000Z'),
      })
      .returning();

    if (!running) {
      throw new Error('Failed to create running attempt');
    }

    const retryAt = new Date('2026-10-05T12:00:30.000Z');

    const result = await repository.markRunFailedAndQueueRetry(
      running,
      new Date('2026-10-05T12:00:01.000Z'),
      'TEST_FAILURE',
      'Retry test failure',
      retryAt,
      2,
    );

    expect(result.completedRun).toEqual(
      expect.objectContaining({
        id: running.id,
        status: 'failed',
        attempt: 1,
        errorCode: 'TEST_FAILURE',
      }),
    );

    expect(result.retryRun).toEqual(
      expect.objectContaining({
        jobDefinitionId: job.id,

        scheduleId: schedule.id,
        scheduledFor,

        status: 'queued',
        triggerType: 'schedule',

        attempt: 2,
        availableAt: retryAt,
      }),
    );

    const runs = await repository.listRunsForDefinition(job.id);

    const attempts = runs
      .filter(
        (run) =>
          run.scheduleId === schedule.id && run.scheduledFor?.getTime() === scheduledFor.getTime(),
      )
      .map((run) => run.attempt)
      .sort((a, b) => a - b);

    expect(attempts).toEqual([1, 2]);
  });

  it('does not create a retry after maxRetries is exhausted', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.retry-exhausted',
        ownerType: 'platform',
        ownerId: null,
        name: 'Retry Exhausted',
        handler: 'run.retry-exhausted',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const startedAt = new Date('2026-10-06T12:00:00.000Z');

    const [running] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,

        triggerType: 'manual',

        status: 'running',
        attempt: 2,

        availableAt: startedAt,

        startedAt,

        timeoutAt: new Date('2026-10-06T12:05:00.000Z'),

        claimedBy: 'worker-a',
        claimedAt: startedAt,
        leaseExpiresAt: new Date('2026-10-06T12:05:00.000Z'),
      })
      .returning();

    if (!running) {
      throw new Error('Failed to create running attempt');
    }

    const result = await repository.markRunFailedAndQueueRetry(
      running,
      new Date('2026-10-06T12:00:01.000Z'),
      null,
      'Final failure',
      new Date('2026-10-06T12:00:31.000Z'),
      1,
    );

    expect(result.completedRun.status).toBe('failed');

    expect(result.retryRun).toBeNull();

    const runs = await repository.listRunsForDefinition(job.id);

    expect(runs.filter((run) => run.jobDefinitionId === job.id)).toHaveLength(1);
  });

  it('does not claim a queued run before availableAt', async () => {
    const [job] = await database.db
      .insert(jobDefinitions)
      .values({
        key: 'run.future-claim',
        ownerType: 'platform',
        ownerId: null,
        name: 'Future Claim',
        handler: 'run.future-claim',
      })
      .returning({
        id: jobDefinitions.id,
      });

    if (!job) {
      throw new Error('Failed to create job definition');
    }

    const now = new Date('2026-10-07T12:00:00.000Z');

    const availableAt = new Date('2026-10-07T12:05:00.000Z');

    const [run] = await database.db
      .insert(jobRuns)
      .values({
        jobDefinitionId: job.id,

        triggerType: 'manual',

        status: 'queued',

        availableAt,
      })
      .returning({
        id: jobRuns.id,
      });

    if (!run) {
      throw new Error('Failed to create future job run');
    }

    const earlyClaim = await repository.claimRun(
      run.id,
      'worker-a',
      now,
      new Date('2026-10-07T12:10:00.000Z'),
      new Date('2026-10-07T12:10:00.000Z'),
    );

    expect(earlyClaim).toBeNull();

    const allowedClaimAt = availableAt;

    const allowedClaim = await repository.claimRun(
      run.id,
      'worker-a',
      allowedClaimAt,
      new Date('2026-10-07T12:10:00.000Z'),
      new Date('2026-10-07T12:10:00.000Z'),
    );

    expect(allowedClaim).toEqual(
      expect.objectContaining({
        id: run.id,
        status: 'running',
        claimedBy: 'worker-a',
        claimedAt: allowedClaimAt,
      }),
    );
  });
});
