import { Injectable } from '@nestjs/common';

import type { JobDefinition, JobRun } from '../database/schema/index.js';
import { JobHandlerRegistry } from './job-handler.registry.js';
import { JobRepository } from './job.repository.js';
import { validateJobRun } from './job-run.validation.js';

export type QueueManualJobInput = {
  jobDefinitionId: string;

  input?: Record<string, unknown>;

  requestedByType?: string | null;
  requestedById?: string | null;
};

export type QueueScheduledJobInput = {
  scheduledFor: Date;
  jobDefinitionId: string;
  scheduleId: string;

  input?: Record<string, unknown>;
};

@Injectable()
export class JobService {
  constructor(
    private readonly repository: JobRepository,
    private readonly handlers: JobHandlerRegistry,
  ) {}

  async getDefinitionOrThrow(id: string): Promise<JobDefinition> {
    const definition = await this.repository.findDefinitionById(id);

    if (!definition) {
      throw new Error(`Job definition "${id}" was not found`);
    }

    return definition;
  }

  async queueManualRun(request: QueueManualJobInput): Promise<JobRun> {
    const definition = await this.getRunnableDefinition(request.jobDefinitionId);

    validateJobRun({
      status: 'queued',
      triggerType: 'manual',
      attempt: 1,
    });

    return this.repository.createRun({
      jobDefinitionId: definition.id,

      status: 'queued',
      triggerType: 'manual',
      attempt: 1,

      requestedByType: request.requestedByType ?? null,

      requestedById: request.requestedById ?? null,

      input: request.input ?? {},
    });
  }

  async queueScheduledRun(request: QueueScheduledJobInput): Promise<JobRun | null> {
    const definition = await this.getRunnableDefinition(request.jobDefinitionId);

    const schedule = await this.repository.findScheduleById(request.scheduleId);

    if (!schedule) {
      throw new Error(`Job schedule "${request.scheduleId}" was not found`);
    }

    if (schedule.jobDefinitionId !== definition.id) {
      throw new Error('Job schedule does not belong to the requested job definition');
    }

    if (!schedule.isEnabled) {
      throw new Error(`Job schedule "${schedule.id}" is disabled`);
    }

    validateJobRun({
      status: 'queued',
      triggerType: 'schedule',
      scheduleId: schedule.id,
      scheduledFor: request.scheduledFor,
      attempt: 1,
    });

    return this.repository.createScheduledRunIfAbsent({
      jobDefinitionId: definition.id,
      scheduleId: schedule.id,
      scheduledFor: request.scheduledFor,

      status: 'queued',
      triggerType: 'schedule',
      attempt: 1,

      input: request.input ?? {},
    });
  }

  private async getRunnableDefinition(id: string): Promise<JobDefinition> {
    const definition = await this.getDefinitionOrThrow(id);

    if (!definition.isEnabled) {
      throw new Error(`Job definition "${id}" is disabled`);
    }

    if (!this.handlers.has(definition.handler)) {
      throw new Error(`Job handler "${definition.handler}" is not registered`);
    }

    return definition;
  }
}
