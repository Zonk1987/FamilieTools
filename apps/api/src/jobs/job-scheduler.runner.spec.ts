import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JobSchedulerRunner } from './job-scheduler.runner.js';
import { JobSchedulerService } from './job-scheduler.service.js';

describe('JobSchedulerRunner', () => {
  const originalInterval = process.env.JOB_SCHEDULER_INTERVAL_MS;
  const originalWorkerId = process.env.JOB_WORKER_ID;

  beforeEach(() => {
    vi.useFakeTimers();

    process.env.JOB_SCHEDULER_INTERVAL_MS = '1000';
    process.env.JOB_WORKER_ID = 'test-worker';
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalInterval === undefined) {
      delete process.env.JOB_SCHEDULER_INTERVAL_MS;
    } else {
      process.env.JOB_SCHEDULER_INTERVAL_MS = originalInterval;
    }

    if (originalWorkerId === undefined) {
      delete process.env.JOB_WORKER_ID;
    } else {
      process.env.JOB_WORKER_ID = originalWorkerId;
    }
  });

  it('runs immediately and then on the configured interval', async () => {
    const scheduler = {
      tick: vi.fn().mockResolvedValue(undefined),
    };

    const runner = new JobSchedulerRunner(scheduler as unknown as JobSchedulerService);

    runner.onApplicationBootstrap();

    vi.runAllTicks();

    expect(scheduler.tick).toHaveBeenCalledTimes(1);
    expect(scheduler.tick).toHaveBeenCalledWith('test-worker');

    await vi.advanceTimersByTimeAsync(1000);

    expect(scheduler.tick).toHaveBeenCalledTimes(2);

    await runner.onApplicationShutdown();
  });

  it('does not overlap ticks while a previous tick is still running', async () => {
    let resolveFirst!: () => void;

    const firstTick = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    const scheduler = {
      tick: vi.fn().mockReturnValue(firstTick),
    };

    const runner = new JobSchedulerRunner(scheduler as unknown as JobSchedulerService);

    runner.onApplicationBootstrap();

    vi.runAllTicks();

    expect(scheduler.tick).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);

    expect(scheduler.tick).toHaveBeenCalledTimes(1);

    resolveFirst();

    await firstTick;
    vi.runAllTicks();

    await vi.advanceTimersByTimeAsync(1000);

    expect(scheduler.tick).toHaveBeenCalledTimes(2);

    resolveFirst();

    await runner.onApplicationShutdown();
  });

  it('stops scheduling new ticks on application shutdown and waits for the active tick', async () => {
    let resolveTick!: () => void;

    const activeTick = new Promise<void>((resolve) => {
      resolveTick = resolve;
    });

    const scheduler = {
      tick: vi.fn().mockReturnValue(activeTick),
    };

    const runner = new JobSchedulerRunner(scheduler as unknown as JobSchedulerService);

    runner.onApplicationBootstrap();

    vi.runAllTicks();

    let shutdownFinished = false;

    const shutdown = runner.onApplicationShutdown().then(() => {
      shutdownFinished = true;
    });

    await vi.advanceTimersByTimeAsync(5000);

    expect(scheduler.tick).toHaveBeenCalledTimes(1);
    expect(shutdownFinished).toBe(false);

    resolveTick();

    await shutdown;

    expect(shutdownFinished).toBe(true);
  });

  it('rejects an invalid scheduler interval', () => {
    process.env.JOB_SCHEDULER_INTERVAL_MS = '100';

    const scheduler = {
      tick: vi.fn(),
    };

    expect(
      () => new JobSchedulerRunner(scheduler as unknown as JobSchedulerService),
    ).toThrow('JOB_SCHEDULER_INTERVAL_MS must be an integer greater than or equal to 250');
  });
});
