import { Injectable } from '@nestjs/common';

import type { JobRun } from '../database/schema/index.js';
import { JobHandlerRegistry } from './job-handler.registry.js';
import { JobRepository } from './job.repository.js';

class JobTimeoutError extends Error {
  constructor() {
    super('Job execution timed out');
    this.name = 'JobTimeoutError';
  }
}

@Injectable()
export class JobExecutor {
  constructor(
    private readonly repository: JobRepository,
    private readonly handlers: JobHandlerRegistry,
  ) {}

  async execute(runId: string, workerId: string): Promise<JobRun> {
    if (workerId.trim().length === 0) {
      throw new Error('workerId must not be empty');
    }

    const run = await this.repository.findRunById(runId);

    if (!run) {
      throw new Error(`Job run "${runId}" was not found`);
    }

    if (run.status !== 'queued') {
      throw new Error(`Job run "${runId}" is not queued`);
    }

    const definition = await this.repository.findDefinitionById(run.jobDefinitionId);

    if (!definition) {
      throw new Error(`Job definition "${run.jobDefinitionId}" was not found`);
    }

    if (!definition.isEnabled) {
      throw new Error(`Job definition "${definition.id}" is disabled`);
    }

    const handler = this.handlers.get(definition.handler);

    const claimedAt = new Date();

    const timeoutAt = new Date(claimedAt.getTime() + definition.defaultTimeoutSeconds * 1000);

    const leaseExpiresAt = timeoutAt;

    const claimedRun = await this.repository.claimRun(
      run.id,
      workerId,
      claimedAt,
      timeoutAt,
      leaseExpiresAt,
    );

    if (!claimedRun) {
      throw new Error(`Job run "${run.id}" could not be claimed`);
    }

    const abortController = new AbortController();

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        abortController.abort();

        reject(new JobTimeoutError());
      }, definition.defaultTimeoutSeconds * 1000);
    });

    try {
      const result = await Promise.race([
        Promise.resolve(
          handler({
            runId: claimedRun.id,

            jobDefinitionId: definition.id,

            ownerType: definition.ownerType,

            ownerId: definition.ownerId,

            attempt: claimedRun.attempt,

            input: claimedRun.input,

            signal: abortController.signal,
          }),
        ),

        timeoutPromise,
      ]);

      const output = result ?? {};

      if (typeof output !== 'object' || output === null || Array.isArray(output)) {
        throw new Error('Job handler output must be an object');
      }

      return this.repository.markRunSucceeded(claimedRun.id, new Date(), output);
    } catch (error) {
      if (error instanceof JobTimeoutError) {
        return this.repository.markRunTimedOut(claimedRun.id, new Date(), timeoutAt);
      }

      const normalized = this.normalizeError(error);

      return this.repository.markRunFailed(
        claimedRun.id,
        new Date(),
        normalized.code,
        normalized.message,
      );
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private normalizeError(error: unknown): {
    code: string | null;
    message: string;
  } {
    if (error instanceof Error) {
      const candidate = error as Error & {
        code?: unknown;
      };

      return {
        code: typeof candidate.code === 'string' ? candidate.code : null,

        message: error.message.trim().length > 0 ? error.message : 'Job execution failed',
      };
    }

    if (typeof error === 'string') {
      return {
        code: null,

        message: error.trim().length > 0 ? error : 'Job execution failed',
      };
    }

    return {
      code: null,
      message: 'Job execution failed',
    };
  }
}
