import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobDefinition, JobRun, JobSchedule } from '../database/schema/index.js';
import { JobHandlerRegistry } from './job-handler.registry.js';
import { JobRepository } from './job.repository.js';
import { JobService } from './job.service.js';

const definition: JobDefinition = {
  id: '11111111-1111-4111-8111-111111111111',

  key: 'core.test',
  ownerType: 'platform',
  ownerId: null,

  name: 'Core Test',
  description: null,

  handler: 'core.test',

  defaultTimeoutSeconds: 300,
  maxRetries: 0,
  retryDelaySeconds: 0,

  isEnabled: true,
  metadata: {},

  createdAt: new Date('2026-09-24T12:00:00.000Z'),

  updatedAt: new Date('2026-09-24T12:00:00.000Z'),
};

const schedule: JobSchedule = {
  id: '22222222-2222-4222-8222-222222222222',

  jobDefinitionId: definition.id,

  scheduleType: 'once',

  runAt: new Date('2026-10-01T12:00:00.000Z'),

  intervalSeconds: null,
  cronExpression: null,

  timezone: 'UTC',

  nextRunAt: new Date('2026-10-01T12:00:00.000Z'),

  lastRunAt: null,

  isEnabled: true,
  metadata: {},

  createdAt: new Date('2026-09-24T12:00:00.000Z'),

  updatedAt: new Date('2026-09-24T12:00:00.000Z'),
};

const queuedRun: JobRun = {
  id: '33333333-3333-4333-8333-333333333333',

  jobDefinitionId: definition.id,

  scheduleId: null,
  scheduledFor: null,

  status: 'queued',
  triggerType: 'manual',

  attempt: 1,

  availableAt: new Date('2026-09-24T12:00:00.000Z'),

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

  createdAt: new Date('2026-09-24T12:00:00.000Z'),
};

describe('JobService', () => {
  let repository: {
    findDefinitionById: ReturnType<typeof vi.fn>;

    findScheduleById: ReturnType<typeof vi.fn>;

    createRun: ReturnType<typeof vi.fn>;

    createScheduledRunIfAbsent: ReturnType<typeof vi.fn>;
  };

  let handlers: JobHandlerRegistry;
  let service: JobService;

  beforeEach(() => {
    repository = {
      findDefinitionById: vi.fn(),
      findScheduleById: vi.fn(),
      createRun: vi.fn(),

      createScheduledRunIfAbsent: vi.fn(),
    };

    handlers = new JobHandlerRegistry();

    handlers.register('core.test', async () => ({
      ok: true,
    }));

    service = new JobService(repository as unknown as JobRepository, handlers);
  });

  it('returns an existing job definition', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    await expect(service.getDefinitionOrThrow(definition.id)).resolves.toBe(definition);
  });

  it('rejects an unknown job definition', async () => {
    repository.findDefinitionById.mockResolvedValue(null);

    await expect(service.getDefinitionOrThrow(definition.id)).rejects.toThrow(
      `Job definition "${definition.id}" was not found`,
    );
  });

  it('queues a manual run', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.createRun.mockResolvedValue(queuedRun);

    const result = await service.queueManualRun({
      jobDefinitionId: definition.id,

      input: {
        hello: 'world',
      },

      requestedByType: 'user',
      requestedById: 'user-123',
    });

    expect(result).toBe(queuedRun);

    expect(repository.createRun).toHaveBeenCalledWith({
      jobDefinitionId: definition.id,

      status: 'queued',
      triggerType: 'manual',
      attempt: 1,

      requestedByType: 'user',
      requestedById: 'user-123',

      input: {
        hello: 'world',
      },
    });

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects a disabled job definition', async () => {
    repository.findDefinitionById.mockResolvedValue({
      ...definition,
      isEnabled: false,
    });

    await expect(
      service.queueManualRun({
        jobDefinitionId: definition.id,
      }),
    ).rejects.toThrow(`Job definition "${definition.id}" is disabled`);

    expect(repository.createRun).not.toHaveBeenCalled();

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects a job without a registered handler', async () => {
    repository.findDefinitionById.mockResolvedValue({
      ...definition,

      handler: 'core.not-registered',
    });

    await expect(
      service.queueManualRun({
        jobDefinitionId: definition.id,
      }),
    ).rejects.toThrow('Job handler "core.not-registered" is not registered');

    expect(repository.createRun).not.toHaveBeenCalled();

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });

  it('queues a scheduled run', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.findScheduleById.mockResolvedValue(schedule);

    const scheduledRun: JobRun = {
      ...queuedRun,

      scheduleId: schedule.id,

      scheduledFor: new Date('2026-10-01T12:00:00.000Z'),

      triggerType: 'schedule',
    };

    repository.createScheduledRunIfAbsent.mockResolvedValue(scheduledRun);

    const result = await service.queueScheduledRun({
      jobDefinitionId: definition.id,

      scheduleId: schedule.id,

      scheduledFor: new Date('2026-10-01T12:00:00.000Z'),

      input: {
        scheduled: true,
      },
    });

    expect(result).toBe(scheduledRun);

    expect(result?.triggerType).toBe('schedule');

    expect(repository.createScheduledRunIfAbsent).toHaveBeenCalledWith({
      jobDefinitionId: definition.id,

      scheduleId: schedule.id,

      scheduledFor: new Date('2026-10-01T12:00:00.000Z'),

      status: 'queued',
      triggerType: 'schedule',
      attempt: 1,

      input: {
        scheduled: true,
      },
    });

    expect(repository.createRun).not.toHaveBeenCalled();
  });

  it('returns null when the scheduled run already exists', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.findScheduleById.mockResolvedValue(schedule);

    repository.createScheduledRunIfAbsent.mockResolvedValue(null);

    const result = await service.queueScheduledRun({
      jobDefinitionId: definition.id,

      scheduleId: schedule.id,

      scheduledFor: new Date('2026-10-01T12:00:00.000Z'),
    });

    expect(result).toBeNull();

    expect(repository.createScheduledRunIfAbsent).toHaveBeenCalledOnce();
  });

  it('rejects an unknown schedule', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.findScheduleById.mockResolvedValue(null);

    await expect(
      service.queueScheduledRun({
        jobDefinitionId: definition.id,

        scheduleId: schedule.id,

        scheduledFor: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).rejects.toThrow(`Job schedule "${schedule.id}" was not found`);

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects a schedule belonging to another definition', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.findScheduleById.mockResolvedValue({
      ...schedule,

      jobDefinitionId: '44444444-4444-4444-8444-444444444444',
    });

    await expect(
      service.queueScheduledRun({
        jobDefinitionId: definition.id,

        scheduleId: schedule.id,

        scheduledFor: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).rejects.toThrow('Job schedule does not belong to the requested job definition');

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects a disabled schedule', async () => {
    repository.findDefinitionById.mockResolvedValue(definition);

    repository.findScheduleById.mockResolvedValue({
      ...schedule,
      isEnabled: false,
    });

    await expect(
      service.queueScheduledRun({
        jobDefinitionId: definition.id,

        scheduleId: schedule.id,

        scheduledFor: new Date('2026-10-01T12:00:00.000Z'),
      }),
    ).rejects.toThrow(`Job schedule "${schedule.id}" is disabled`);

    expect(repository.createScheduledRunIfAbsent).not.toHaveBeenCalled();
  });
});
