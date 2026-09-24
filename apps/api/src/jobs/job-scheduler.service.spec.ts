import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobRun, JobSchedule } from '../database/schema/index.js';
import { JobExecutor } from './job.executor.js';
import { JobRepository } from './job.repository.js';
import { JobSchedulerService } from './job-scheduler.service.js';

const schedule: JobSchedule = {
  id: '11111111-1111-4111-8111-111111111111',
  jobDefinitionId: '22222222-2222-4222-8222-222222222222',
  scheduleType: 'once',
  runAt: new Date('2026-09-24T18:00:00.000Z'),
  intervalSeconds: null,
  cronExpression: null,
  timezone: 'UTC',
  nextRunAt: new Date('2026-09-24T18:00:00.000Z'),
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
  scheduledFor: new Date('2026-09-24T18:00:00.000Z'),
  status: 'queued',
  triggerType: 'schedule',
  attempt: 1,
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
  createdAt: new Date('2026-09-24T18:00:00.000Z'),
};

describe('JobSchedulerService', () => {
  let repository: {
    recoverExpiredLeases: ReturnType<typeof vi.fn>;
    listDueSchedules: ReturnType<typeof vi.fn>;
    createScheduledRunAndAdvance: ReturnType<typeof vi.fn>;
  };

  let executor: {
    execute: ReturnType<typeof vi.fn>;
  };

  let scheduler: JobSchedulerService;

  beforeEach(() => {
    repository = {
      recoverExpiredLeases: vi.fn(),
      listDueSchedules: vi.fn(),
      createScheduledRunAndAdvance: vi.fn(),
    };

    executor = {
      execute: vi.fn(),
    };

    scheduler = new JobSchedulerService(
      repository as unknown as JobRepository,
      executor as unknown as JobExecutor,
    );
  });

  it('recovers expired leases before processing schedules', async () => {
    const now = new Date('2026-09-24T18:00:00.000Z');

    repository.recoverExpiredLeases.mockResolvedValue([]);
    repository.listDueSchedules.mockResolvedValue([]);

    await scheduler.tick('worker-a', now);

    expect(repository.recoverExpiredLeases).toHaveBeenCalledWith(now);
    expect(repository.listDueSchedules).toHaveBeenCalledWith(now);
    expect(repository.recoverExpiredLeases.mock.invocationCallOrder[0]).toBeLessThan(
      repository.listDueSchedules.mock.invocationCallOrder[0],
    );
  });

  it('atomically creates, advances and executes a due once schedule', async () => {
    const now = new Date('2026-09-24T18:00:00.000Z');

    repository.recoverExpiredLeases.mockResolvedValue([]);
    repository.listDueSchedules.mockResolvedValue([schedule]);
    repository.createScheduledRunAndAdvance.mockResolvedValue(queuedRun);
    executor.execute.mockResolvedValue({
      ...queuedRun,
      status: 'succeeded',
      startedAt: new Date('2026-09-24T18:00:00.000Z'),
      finishedAt: new Date('2026-09-24T18:00:01.000Z'),
      timeoutAt: new Date('2026-09-24T18:05:00.000Z'),
      claimedBy: 'worker-a',
      claimedAt: new Date('2026-09-24T18:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T18:05:00.000Z'),
    });

    await scheduler.tick('worker-a', now);

    expect(repository.createScheduledRunAndAdvance).toHaveBeenCalledWith(
      schedule,
      schedule.nextRunAt,
      null,
    );
    expect(executor.execute).toHaveBeenCalledWith(queuedRun.id, 'worker-a');
  });

  it('does not execute when another scheduler already processed the occurrence', async () => {
    repository.recoverExpiredLeases.mockResolvedValue([]);
    repository.listDueSchedules.mockResolvedValue([schedule]);
    repository.createScheduledRunAndAdvance.mockResolvedValue(null);

    await scheduler.tick('worker-a');

    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('processes multiple due schedules', async () => {
    const secondSchedule: JobSchedule = {
      ...schedule,
      id: '44444444-4444-4444-8444-444444444444',
      nextRunAt: new Date('2026-09-24T18:01:00.000Z'),
      runAt: new Date('2026-09-24T18:01:00.000Z'),
    };

    const secondRun: JobRun = {
      ...queuedRun,
      id: '55555555-5555-4555-8555-555555555555',
      scheduleId: secondSchedule.id,
      scheduledFor: secondSchedule.nextRunAt,
    };

    repository.recoverExpiredLeases.mockResolvedValue([]);
    repository.listDueSchedules.mockResolvedValue([schedule, secondSchedule]);
    repository.createScheduledRunAndAdvance
      .mockResolvedValueOnce(queuedRun)
      .mockResolvedValueOnce(secondRun);
    executor.execute.mockResolvedValue(queuedRun);

    await scheduler.tick('worker-a');

    expect(repository.createScheduledRunAndAdvance).toHaveBeenCalledTimes(2);
    expect(executor.execute).toHaveBeenCalledTimes(2);
  });

  it('continues with the next schedule if one fails', async () => {
    const secondSchedule: JobSchedule = {
      ...schedule,
      id: '44444444-4444-4444-8444-444444444444',
      nextRunAt: new Date('2026-09-24T18:01:00.000Z'),
      runAt: new Date('2026-09-24T18:01:00.000Z'),
    };

    const secondRun: JobRun = {
      ...queuedRun,
      id: '55555555-5555-4555-8555-555555555555',
      scheduleId: secondSchedule.id,
      scheduledFor: secondSchedule.nextRunAt,
    };

    repository.recoverExpiredLeases.mockResolvedValue([]);
    repository.listDueSchedules.mockResolvedValue([schedule, secondSchedule]);
    repository.createScheduledRunAndAdvance
      .mockRejectedValueOnce(new Error('First failed'))
      .mockResolvedValueOnce(secondRun);
    executor.execute.mockResolvedValue(secondRun);

    await expect(scheduler.tick('worker-a')).resolves.toBeUndefined();

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(executor.execute).toHaveBeenCalledWith(secondRun.id, 'worker-a');
  });

  it('rejects an empty workerId', async () => {
    await expect(scheduler.tick('   ')).rejects.toThrow('workerId must not be empty');

    expect(repository.recoverExpiredLeases).not.toHaveBeenCalled();
    expect(repository.listDueSchedules).not.toHaveBeenCalled();
    expect(repository.createScheduledRunAndAdvance).not.toHaveBeenCalled();
    expect(executor.execute).not.toHaveBeenCalled();
  });
});
