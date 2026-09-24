import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import { JobSchedulerService } from './job-scheduler.service.js';

const DEFAULT_INTERVAL_MS = 5_000;
const MIN_INTERVAL_MS = 250;

function getSchedulerIntervalMs(): number {
  const configured = process.env.JOB_SCHEDULER_INTERVAL_MS?.trim();

  if (!configured) {
    return DEFAULT_INTERVAL_MS;
  }

  const value = Number(configured);

  if (!Number.isInteger(value) || value < MIN_INTERVAL_MS) {
    throw new Error(
      `JOB_SCHEDULER_INTERVAL_MS must be an integer greater than or equal to ${MIN_INTERVAL_MS}`,
    );
  }

  return value;
}

function getWorkerId(): string {
  const configured = process.env.JOB_WORKER_ID?.trim();

  if (configured) {
    return configured;
  }

  return `${hostname()}:${process.pid}:${randomUUID()}`;
}

@Injectable()
export class JobSchedulerRunner implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(JobSchedulerRunner.name);
  private readonly intervalMs = getSchedulerIntervalMs();
  private readonly workerId = getWorkerId();

  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight: Promise<void> | null = null;
  private stopping = false;

  constructor(private readonly scheduler: JobSchedulerService) {}

  onApplicationBootstrap(): void {
    if (this.timer) {
      return;
    }

    this.logger.log(
      `Starting job scheduler worker "${this.workerId}" with ${this.intervalMs}ms interval`,
    );

    void this.runTick();

    this.timer = setInterval(() => {
      void this.runTick();
    }, this.intervalMs);

    this.timer.unref?.();
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.inFlight) {
      await this.inFlight;
    }

    this.logger.log(`Stopped job scheduler worker "${this.workerId}"`);
  }

  private runTick(): Promise<void> {
    if (this.stopping || this.inFlight) {
      return this.inFlight ?? Promise.resolve();
    }

    const task = this.scheduler
      .tick(this.workerId)
      .catch((error: unknown) => {
        this.logger.error(
          'Job scheduler tick failed',
          error instanceof Error ? error.stack : String(error),
        );
      })
      .finally(() => {
        if (this.inFlight === task) {
          this.inFlight = null;
        }
      });

    this.inFlight = task;

    return task;
  }
}
