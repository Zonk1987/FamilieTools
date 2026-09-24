import { Injectable, Logger } from '@nestjs/common';

import { JobExecutor } from './job.executor.js';
import { JobRepository } from './job.repository.js';
import { computeNextRunAt } from './job-schedule.next-run.js';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    private readonly repository: JobRepository,
    private readonly executor: JobExecutor,
  ) {}

  async tick(workerId: string, now = new Date()): Promise<void> {
    if (workerId.trim().length === 0) {
      throw new Error('workerId must not be empty');
    }

    await this.repository.recoverExpiredLeases(now);

    const dueSchedules = await this.repository.listDueSchedules(now);

    for (const schedule of dueSchedules) {
      try {
        if (!schedule.nextRunAt) {
          continue;
        }

        const scheduledFor = schedule.nextRunAt;
        const nextRunAt = computeNextRunAt(schedule, scheduledFor);

        const run = await this.repository.createScheduledRunAndAdvance(
          schedule,
          scheduledFor,
          nextRunAt,
        );

        if (!run) {
          this.logger.debug(
            `Schedule "${schedule.id}" was already processed by another scheduler instance`,
          );
          continue;
        }

        await this.executor.execute(run.id, workerId);
      } catch (error) {
        this.logger.error(
          `Failed to process schedule "${schedule.id}"`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
