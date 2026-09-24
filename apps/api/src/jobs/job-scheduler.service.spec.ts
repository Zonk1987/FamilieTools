import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobRun, JobSchedule } from '../database/schema/index.js';
import { JobExecutor } from './job.executor.js';
import { JobRepository } from './job.repository.js';
import { JobSchedulerService } from './job-scheduler.service.js';

const now = new Date('2026-09-24T18:00:00.000Z');

const schedule: JobSchedule = {
  id: '11111111-1111-4111-8111-111111111111',
  jobDefinitionId: '22222222-2222-4222-8222-222222222222',

  scheduleType: 'once',

  runAt: now,

  intervalSeconds: null,
  cronExpression: null,

  timezone: 'UTC',

  nextRunAt: now,
  lastRunAt: null,

  isEnabled: true,

  metadata: {},

  createdAt: new Date('2026-09-24T17:00:00.000Z'),
  updatedAt: new Date('2026-09-24T17:00:00.000Z'),
};

const queuedRun: JobRun = {
  id: '33333333-3333-4333-8333-333333333333',

  jobDefinitionId: schedule.jobDefinitionId,

  scheduleId: schedule.id,
  scheduledFor: now,

  status: 'queued',
  triggerType: 'schedule',

  attempt: 1,
  availableAt: now,

  requestedByType: null,
  requestedById: null,

  startedAt: null,
  finishedAt: null,
  timeoutAt: null,

  errorCode: null,
  errorMessage: null,

  claimedBy: null,
  claimedAt: null,
  leaseExpiresAt: null,

  input: {},
  output: {},
  metadata: {},

  createdAt: now,
};

describe('JobSchedulerService', () => {
  let repository: {
    recoverExpiredLeases: ReturnType<typeof vi.fn>;
    listDueSchedules: ReturnType<typeof vi.fn>;
    createScheduledRunAndAdvance: ReturnType<typeof vi.fn>;
    listReadyRuns: ReturnType<typeof vi.fn>;
  };

  let executor: {
    execute: ReturnType<typeof vi.fn>;
  };

  let scheduler: JobSchedulerService;

  beforeEach(() => {
    repository = {
      recoverExpiredLeases: vi.fn().mockResolvedValue([]),
      listDueSchedules: vi.fn().mockResolvedValue([]),
      createScheduledRunAndAdvance: vi.fn(),
      listReadyRuns: vi.fn().mockResolvedValue([]),
    };

    executor = {
      execute: vi.fn(),
    };

    scheduler = new JobSchedulerService(
      repository as unknown as JobRepository,
      executor as unknown as JobExecutor,
    );
  });

  it('recovers expired leases before processing schedules and ready runs', async () => {
    await scheduler.tick('worker-a', now);

    expect(repository.recoverExpiredLeases).toHaveBeenCalledWith(now);

    expect(repository.listDueSchedules).toHaveBeenCalledWith(now);

    expect(repository.listReadyRuns).toHaveBeenCalledWith(now);

    expect(repository.recoverExpiredLeases.mock.invocationCallOrder[0]).toBeLessThan(
      repository.listDueSchedules.mock.invocationCallOrder[0],
    );
  });

  it('creates a run for a due schedule and then executes ready runs', async () => {
    repository.listDueSchedules.mockResolvedValue([schedule]);

    repository.createScheduledRunAndAdvance.mockResolvedValue(queuedRun);

    repository.listReadyRuns.mockResolvedValue([queuedRun]);

    executor.execute.mockResolvedValue({
      ...queuedRun,

      status: 'succeeded',

      startedAt: now,

      finishedAt: new Date('2026-09-24T18:00:01.000Z'),

      timeoutAt: new Date('2026-09-24T18:05:00.000Z'),

      claimedBy: 'worker-a',
      claimedAt: now,

      leaseExpiresAt: new Date('2026-09-24T18:05:00.000Z'),
    });

    await scheduler.tick('worker-a', now);

    expect(repository.createScheduledRunAndAdvance).toHaveBeenCalledWith(
      schedule,
      schedule.nextRunAt,
      null,
    );

    expect(repository.listReadyRuns).toHaveBeenCalledWith(now);

    expect(executor.execute).toHaveBeenCalledWith(queuedRun.id, 'worker-a');
  });

  it('executes a ready manual run without a schedule', async () => {
    const manualRun: JobRun = {
      ...queuedRun,

      id: '44444444-4444-4444-8444-444444444444',

      scheduleId: null,
      scheduledFor: null,

      triggerType: 'manual',

      attempt: 1,
    };

    repository.listReadyRuns.mockResolvedValue([manualRun]);

    executor.execute.mockResolvedValue(manualRun);

    await scheduler.tick('worker-a', now);

    expect(executor.execute).toHaveBeenCalledWith(manualRun.id, 'worker-a');
  });

  it('executes a ready retry run', async () => {
    const retryRun: JobRun = {
      ...queuedRun,

      id: '55555555-5555-4555-8555-555555555555',

      attempt: 2,

      availableAt: new Date('2026-09-24T17:59:30.000Z'),
    };

    repository.listReadyRuns.mockResolvedValue([retryRun]);

    executor.execute.mockResolvedValue(retryRun);

    await scheduler.tick('worker-a', now);

    expect(executor.execute).toHaveBeenCalledWith(retryRun.id, 'worker-a');
  });

  it('continues when another worker claims a ready run first', async () => {
    repository.listReadyRuns.mockResolvedValue([queuedRun]);

    executor.execute.mockRejectedValue(new Error(`Job run "${queuedRun.id}" could not be claimed`));

    await expect(scheduler.tick('worker-a', now)).resolves.toBeUndefined();

    expect(executor.execute).toHaveBeenCalledOnce();
  });

  it('continues with remaining runs when one execution fails', async () => {
    const secondRun: JobRun = {
      ...queuedRun,

      id: '66666666-6666-4666-8666-666666666666',
    };

    repository.listReadyRuns.mockResolvedValue([queuedRun, secondRun]);

    executor.execute
      .mockRejectedValueOnce(new Error('First execution failed'))
      .mockResolvedValueOnce(secondRun);

    await scheduler.tick('worker-a', now);

    expect(executor.execute).toHaveBeenCalledTimes(2);

    expect(executor.execute).toHaveBeenLastCalledWith(secondRun.id, 'worker-a');
  });

  it('rejects an empty workerId', async () => {
    await expect(scheduler.tick('   ')).rejects.toThrow('workerId must not be empty');

    expect(repository.recoverExpiredLeases).not.toHaveBeenCalled();

    expect(repository.listDueSchedules).not.toHaveBeenCalled();

    expect(repository.listReadyRuns).not.toHaveBeenCalled();

    expect(executor.execute).not.toHaveBeenCalled();
  });
});
