import { Injectable, Logger } from '@nestjs/common';

import { JobExecutor } from './job.executor.js';
import { JobRepository } from './job.repository.js';
import { JobService } from './job.service.js';
import { computeNextRunAt } from './job-schedule.next-run.js';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    private readonly repository: JobRepository,
    private readonly jobService: JobService,
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

        const run = await this.jobService.queueScheduledRun({
          jobDefinitionId: schedule.jobDefinitionId,

          scheduleId: schedule.id,

          scheduledFor,
        });

        if (!run) {
          continue;
        }

        const nextRunAt = computeNextRunAt(schedule, scheduledFor);

        const advancedSchedule = await this.repository.advanceSchedule(
          schedule.id,
          scheduledFor,
          scheduledFor,
          nextRunAt,
        );

        if (!advancedSchedule) {
          this.logger.warn(
            `Schedule "${schedule.id}" was already advanced by another scheduler instance`,
          );
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
