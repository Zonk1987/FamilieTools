import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobDefinition, JobRun } from '../database/schema/index.js';
import { JobExecutor } from './job.executor.js';
import { JobHandlerRegistry } from './job-handler.registry.js';
import { JobRepository } from './job.repository.js';

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

const queuedRun: JobRun = {
  id: '22222222-2222-4222-8222-222222222222',
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

  input: {
    value: 42,
  },
  output: {},
  metadata: {},
  createdAt: new Date('2026-09-24T12:00:00.000Z'),
};

describe('JobExecutor', () => {
  let repository: {
    findRunById: ReturnType<typeof vi.fn>;
    findDefinitionById: ReturnType<typeof vi.fn>;
    claimRun: ReturnType<typeof vi.fn>;
    markRunSucceeded: ReturnType<typeof vi.fn>;
    markRunFailedAndQueueRetry: ReturnType<typeof vi.fn>;
    markRunTimedOutAndQueueRetry: ReturnType<typeof vi.fn>;
  };

  let handlers: JobHandlerRegistry;
  let executor: JobExecutor;

  beforeEach(() => {
    repository = {
      findRunById: vi.fn(),
      findDefinitionById: vi.fn(),
      claimRun: vi.fn(),
      markRunSucceeded: vi.fn(),
      markRunFailedAndQueueRetry: vi.fn(),
      markRunTimedOutAndQueueRetry: vi.fn(),
    };

    handlers = new JobHandlerRegistry();

    executor = new JobExecutor(repository as unknown as JobRepository, handlers);
  });

  it('executes a queued job successfully', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(definition);

    const claimedRun: JobRun = {
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    };

    repository.claimRun.mockResolvedValue(claimedRun);

    const succeededRun: JobRun = {
      ...claimedRun,
      status: 'succeeded',
      finishedAt: new Date('2026-09-24T12:01:00.000Z'),
      output: {
        ok: true,
      },
    };

    repository.markRunSucceeded.mockResolvedValue(succeededRun);

    const handler = vi.fn(async () => ({
      ok: true,
    }));

    handlers.register('core.test', handler);

    const result = await executor.execute(queuedRun.id, 'worker-test');

    expect(result).toBe(succeededRun);
    expect(handler).toHaveBeenCalledOnce();

    expect(repository.claimRun).toHaveBeenCalledWith(
      queuedRun.id,
      'worker-test',
      expect.any(Date),
      expect.any(Date),
      expect.any(Date),
    );

    expect(repository.markRunSucceeded).toHaveBeenCalledWith(queuedRun.id, expect.any(Date), {
      ok: true,
    });

    expect(repository.markRunFailedAndQueueRetry).not.toHaveBeenCalled();
    expect(repository.markRunTimedOutAndQueueRetry).not.toHaveBeenCalled();
  });

  it('passes the expected context to the handler', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(definition);

    const claimedRun: JobRun = {
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    };

    repository.claimRun.mockResolvedValue(claimedRun);

    repository.markRunSucceeded.mockResolvedValue({
      ...claimedRun,
      status: 'succeeded',
      finishedAt: new Date('2026-09-24T12:01:00.000Z'),
    });

    const handler = vi.fn(async () => ({}));

    handlers.register('core.test', handler);

    await executor.execute(queuedRun.id, 'worker-test');

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: queuedRun.id,
        jobDefinitionId: definition.id,
        ownerType: 'platform',
        ownerId: null,
        attempt: 1,
        input: {
          value: 42,
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('marks a failed attempt final when retries are disabled', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(definition);

    const claimedRun: JobRun = {
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    };

    repository.claimRun.mockResolvedValue(claimedRun);

    const failedRun: JobRun = {
      ...claimedRun,
      status: 'failed',
      finishedAt: new Date('2026-09-24T12:01:00.000Z'),
      errorMessage: 'Something failed',
    };

    repository.markRunFailedAndQueueRetry.mockResolvedValue({
      completedRun: failedRun,
      retryRun: null,
    });

    handlers.register('core.test', async () => {
      throw new Error('Something failed');
    });

    const result = await executor.execute(queuedRun.id, 'worker-test');

    expect(result).toBe(failedRun);

    expect(repository.markRunFailedAndQueueRetry).toHaveBeenCalledWith(
      claimedRun,
      expect.any(Date),
      null,
      'Something failed',
      expect.any(Date),
      0,
    );
  });

  it('queues a retry after the configured delay', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T12:00:00.000Z'));

    const retryDefinition: JobDefinition = {
      ...definition,
      maxRetries: 2,
      retryDelaySeconds: 30,
    };

    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(retryDefinition);

    const claimedRun: JobRun = {
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    };

    repository.claimRun.mockResolvedValue(claimedRun);

    const failedRun: JobRun = {
      ...claimedRun,
      status: 'failed',
      finishedAt: new Date('2026-09-24T12:00:00.000Z'),
      errorMessage: 'Retry me',
    };

    const retryRun: JobRun = {
      ...queuedRun,
      id: '33333333-3333-4333-8333-333333333333',
      attempt: 2,
      availableAt: new Date('2026-09-24T12:00:30.000Z'),
    };

    repository.markRunFailedAndQueueRetry.mockResolvedValue({
      completedRun: failedRun,
      retryRun,
    });

    handlers.register('core.test', async () => {
      throw new Error('Retry me');
    });

    await executor.execute(queuedRun.id, 'worker-test');

    expect(repository.markRunFailedAndQueueRetry).toHaveBeenCalledWith(
      claimedRun,
      new Date('2026-09-24T12:00:00.000Z'),
      null,
      'Retry me',
      new Date('2026-09-24T12:00:30.000Z'),
      2,
    );

    vi.useRealTimers();
  });

  it('rejects invalid handler output', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(definition);

    const claimedRun: JobRun = {
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    };

    repository.claimRun.mockResolvedValue(claimedRun);

    const failedRun: JobRun = {
      ...claimedRun,
      status: 'failed',
      finishedAt: new Date('2026-09-24T12:01:00.000Z'),
      errorMessage: 'Job handler output must be an object',
    };

    repository.markRunFailedAndQueueRetry.mockResolvedValue({
      completedRun: failedRun,
      retryRun: null,
    });

    handlers.register('core.test', (() => 'invalid') as never);

    const result = await executor.execute(queuedRun.id, 'worker-test');

    expect(result.status).toBe('failed');

    expect(repository.markRunFailedAndQueueRetry).toHaveBeenCalledWith(
      claimedRun,
      expect.any(Date),
      null,
      'Job handler output must be an object',
      expect.any(Date),
      0,
    );
  });

  it('rejects a run that is not queued', async () => {
    repository.findRunById.mockResolvedValue({
      ...queuedRun,
      status: 'running',
      startedAt: new Date('2026-09-24T12:00:00.000Z'),
      timeoutAt: new Date('2026-09-24T12:05:00.000Z'),
      claimedBy: 'worker-test',
      claimedAt: new Date('2026-09-24T12:00:00.000Z'),
      leaseExpiresAt: new Date('2026-09-24T12:05:00.000Z'),
    });

    await expect(executor.execute(queuedRun.id, 'worker-test')).rejects.toThrow(
      `Job run "${queuedRun.id}" is not queued`,
    );

    expect(repository.claimRun).not.toHaveBeenCalled();
  });

  it('rejects an unknown run', async () => {
    repository.findRunById.mockResolvedValue(null);

    await expect(executor.execute(queuedRun.id, 'worker-test')).rejects.toThrow(
      `Job run "${queuedRun.id}" was not found`,
    );

    expect(repository.claimRun).not.toHaveBeenCalled();
  });

  it('rejects a missing job definition', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(null);

    await expect(executor.execute(queuedRun.id, 'worker-test')).rejects.toThrow(
      `Job definition "${definition.id}" was not found`,
    );

    expect(repository.claimRun).not.toHaveBeenCalled();
  });

  it('rejects a disabled job definition', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);

    repository.findDefinitionById.mockResolvedValue({
      ...definition,
      isEnabled: false,
    });

    await expect(executor.execute(queuedRun.id, 'worker-test')).rejects.toThrow(
      `Job definition "${definition.id}" is disabled`,
    );

    expect(repository.claimRun).not.toHaveBeenCalled();
  });

  it('rejects an empty workerId', async () => {
    await expect(executor.execute(queuedRun.id, '   ')).rejects.toThrow(
      'workerId must not be empty',
    );

    expect(repository.findRunById).not.toHaveBeenCalled();
    expect(repository.claimRun).not.toHaveBeenCalled();
  });

  it('does not execute the handler when the run cannot be claimed', async () => {
    repository.findRunById.mockResolvedValue(queuedRun);
    repository.findDefinitionById.mockResolvedValue(definition);
    repository.claimRun.mockResolvedValue(null);

    const handler = vi.fn(async () => ({
      ok: true,
    }));

    handlers.register('core.test', handler);

    await expect(executor.execute(queuedRun.id, 'worker-b')).rejects.toThrow(
      `Job run "${queuedRun.id}" could not be claimed`,
    );

    expect(handler).not.toHaveBeenCalled();
    expect(repository.markRunSucceeded).not.toHaveBeenCalled();
    expect(repository.markRunFailedAndQueueRetry).not.toHaveBeenCalled();
    expect(repository.markRunTimedOutAndQueueRetry).not.toHaveBeenCalled();
  });
});
