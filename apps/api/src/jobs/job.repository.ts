import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, or, isNotNull, isNull, lte } from 'drizzle-orm';

import { DatabaseService } from '../database/database.service.js';
import {
  jobDefinitions,
  jobRuns,
  jobSchedules,
  type JobDefinition,
  type JobRun,
  type JobSchedule,
  type NewJobDefinition,
  type NewJobRun,
  type NewJobSchedule,
} from '../database/schema/index.js';

@Injectable()
export class JobRepository {
  constructor(private readonly database: DatabaseService) {}

  async createDefinition(definition: NewJobDefinition): Promise<JobDefinition> {
    const [created] = await this.database.db.insert(jobDefinitions).values(definition).returning();

    if (!created) {
      throw new Error('Failed to create job definition');
    }

    return created;
  }

  async findDefinitionById(id: string): Promise<JobDefinition | null> {
    const [definition] = await this.database.db
      .select()
      .from(jobDefinitions)
      .where(eq(jobDefinitions.id, id))
      .limit(1);

    return definition ?? null;
  }

  async findDefinitionByKey(
    ownerType: 'platform' | 'workspace' | 'domain' | 'module-instance',
    ownerId: string | null,
    key: string,
  ): Promise<JobDefinition | null> {
    const conditions = [eq(jobDefinitions.ownerType, ownerType), eq(jobDefinitions.key, key)];

    if (ownerId === null) {
      conditions.push(isNull(jobDefinitions.ownerId));
    } else {
      conditions.push(eq(jobDefinitions.ownerId, ownerId));
    }

    const [definition] = await this.database.db
      .select()
      .from(jobDefinitions)
      .where(and(...conditions))
      .limit(1);

    return definition ?? null;
  }

  async listDefinitions(): Promise<JobDefinition[]> {
    return this.database.db
      .select()
      .from(jobDefinitions)
      .orderBy(asc(jobDefinitions.createdAt), asc(jobDefinitions.id));
  }

  async createSchedule(schedule: NewJobSchedule): Promise<JobSchedule> {
    const [created] = await this.database.db.insert(jobSchedules).values(schedule).returning();

    if (!created) {
      throw new Error('Failed to create job schedule');
    }

    return created;
  }

  async findScheduleById(id: string): Promise<JobSchedule | null> {
    const [schedule] = await this.database.db
      .select()
      .from(jobSchedules)
      .where(eq(jobSchedules.id, id))
      .limit(1);

    return schedule ?? null;
  }

  async listSchedulesForDefinition(jobDefinitionId: string): Promise<JobSchedule[]> {
    return this.database.db
      .select()
      .from(jobSchedules)
      .where(eq(jobSchedules.jobDefinitionId, jobDefinitionId))
      .orderBy(asc(jobSchedules.createdAt), asc(jobSchedules.id));
  }

  async listDueSchedules(now: Date, limit = 100): Promise<JobSchedule[]> {
    return this.database.db
      .select()
      .from(jobSchedules)
      .where(
        and(
          eq(jobSchedules.isEnabled, true),
          isNotNull(jobSchedules.nextRunAt),
          lte(jobSchedules.nextRunAt, now),
        ),
      )
      .orderBy(asc(jobSchedules.nextRunAt), asc(jobSchedules.id))
      .limit(limit);
  }

  async listReadyRuns(now: Date, limit = 100): Promise<JobRun[]> {
    return this.database.db
      .select()
      .from(jobRuns)
      .where(and(eq(jobRuns.status, 'queued'), lte(jobRuns.availableAt, now)))
      .orderBy(asc(jobRuns.availableAt), asc(jobRuns.createdAt), asc(jobRuns.id))
      .limit(limit);
  }

  async createScheduledRunAndAdvance(
    schedule: JobSchedule,
    scheduledFor: Date,
    nextRunAt: Date | null,
    input: Record<string, unknown> = {},
  ): Promise<JobRun | null> {
    return this.database.transaction(async (tx) => {
      const [advancedSchedule] = await tx
        .update(jobSchedules)
        .set({
          lastRunAt: scheduledFor,
          nextRunAt,
          isEnabled: nextRunAt !== null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobSchedules.id, schedule.id),
            eq(jobSchedules.isEnabled, true),
            eq(jobSchedules.nextRunAt, scheduledFor),
          ),
        )
        .returning();

      if (!advancedSchedule) {
        return null;
      }

      const [created] = await tx
        .insert(jobRuns)
        .values({
          jobDefinitionId: schedule.jobDefinitionId,
          scheduleId: schedule.id,
          scheduledFor,
          status: 'queued',
          triggerType: 'schedule',
          attempt: 1,
          availableAt: scheduledFor,
          input,
        })
        .onConflictDoNothing({
          target: [jobRuns.scheduleId, jobRuns.scheduledFor, jobRuns.attempt],
        })
        .returning();

      if (created) {
        return created;
      }

      const [existing] = await tx
        .select()
        .from(jobRuns)
        .where(and(eq(jobRuns.scheduleId, schedule.id), eq(jobRuns.scheduledFor, scheduledFor)))
        .limit(1);

      if (!existing) {
        throw new Error(
          `Scheduled job run for schedule "${schedule.id}" at "${scheduledFor.toISOString()}" could not be created`,
        );
      }

      return existing;
    });
  }

  async createRun(run: NewJobRun): Promise<JobRun> {
    const [created] = await this.database.db.insert(jobRuns).values(run).returning();

    if (!created) {
      throw new Error('Failed to create job run');
    }

    return created;
  }

  async findRunById(id: string): Promise<JobRun | null> {
    const [run] = await this.database.db.select().from(jobRuns).where(eq(jobRuns.id, id)).limit(1);

    return run ?? null;
  }

  async listRunsForDefinition(jobDefinitionId: string, limit = 100): Promise<JobRun[]> {
    return this.database.db
      .select()
      .from(jobRuns)
      .where(eq(jobRuns.jobDefinitionId, jobDefinitionId))
      .orderBy(desc(jobRuns.createdAt), desc(jobRuns.id))
      .limit(limit);
  }

  async markRunRunning(id: string, startedAt: Date, timeoutAt: Date): Promise<JobRun> {
    const [updated] = await this.database.db
      .update(jobRuns)
      .set({
        status: 'running',
        startedAt,
        finishedAt: null,
        timeoutAt,
        errorCode: null,
        errorMessage: null,
      })
      .where(eq(jobRuns.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Job run "${id}" was not found`);
    }

    return updated;
  }

  async markRunSucceeded(
    id: string,
    finishedAt: Date,
    output: Record<string, unknown>,
  ): Promise<JobRun> {
    const [updated] = await this.database.db
      .update(jobRuns)
      .set({
        status: 'succeeded',
        finishedAt,
        output,
        errorCode: null,
        errorMessage: null,
      })
      .where(eq(jobRuns.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Job run "${id}" was not found`);
    }

    return updated;
  }

  async markRunFailedAndQueueRetry(
    run: JobRun,
    finishedAt: Date,
    errorCode: string | null,
    errorMessage: string,
    retryAt: Date,
    maxRetries: number,
  ): Promise<{ completedRun: JobRun; retryRun: JobRun | null }> {
    return this.database.transaction(async (tx) => {
      const [completedRun] = await tx
        .update(jobRuns)
        .set({
          status: 'failed',
          finishedAt,
          errorCode,
          errorMessage,
        })
        .where(eq(jobRuns.id, run.id))
        .returning();

      if (!completedRun) {
        throw new Error(`Job run "${run.id}" could not be marked as failed`);
      }

      if (run.attempt > maxRetries) {
        return {
          completedRun,
          retryRun: null,
        };
      }

      const [retryRun] = await tx
        .insert(jobRuns)
        .values({
          jobDefinitionId: run.jobDefinitionId,

          scheduleId: run.scheduleId,
          scheduledFor: run.scheduledFor,

          status: 'queued',
          triggerType: run.triggerType,

          attempt: run.attempt + 1,
          availableAt: retryAt,

          requestedByType: run.requestedByType,
          requestedById: run.requestedById,

          input: run.input,
          metadata: run.metadata,
        })
        .returning();

      if (!retryRun) {
        throw new Error(`Retry for job run "${run.id}" could not be created`);
      }

      return {
        completedRun,
        retryRun,
      };
    });
  }

  async markRunTimedOutAndQueueRetry(
    run: JobRun,
    finishedAt: Date,
    timeoutAt: Date,
    retryAt: Date,
    maxRetries: number,
  ): Promise<{ completedRun: JobRun; retryRun: JobRun | null }> {
    return this.database.transaction(async (tx) => {
      const [completedRun] = await tx
        .update(jobRuns)
        .set({
          status: 'timed_out',
          finishedAt,
          timeoutAt,
          errorCode: null,
          errorMessage: null,
        })
        .where(eq(jobRuns.id, run.id))
        .returning();

      if (!completedRun) {
        throw new Error(`Job run "${run.id}" could not be marked as timed out`);
      }

      if (run.attempt > maxRetries) {
        return {
          completedRun,
          retryRun: null,
        };
      }

      const [retryRun] = await tx
        .insert(jobRuns)
        .values({
          jobDefinitionId: run.jobDefinitionId,

          scheduleId: run.scheduleId,
          scheduledFor: run.scheduledFor,

          status: 'queued',
          triggerType: run.triggerType,

          attempt: run.attempt + 1,
          availableAt: retryAt,

          requestedByType: run.requestedByType,
          requestedById: run.requestedById,

          input: run.input,
          metadata: run.metadata,
        })
        .returning();

      if (!retryRun) {
        throw new Error(`Retry for job run "${run.id}" could not be created`);
      }

      return {
        completedRun,
        retryRun,
      };
    });
  }

  async claimRun(
    id: string,
    workerId: string,
    claimedAt: Date,
    timeoutAt: Date,
    leaseExpiresAt: Date,
  ): Promise<JobRun | null> {
    const [claimed] = await this.database.db
      .update(jobRuns)
      .set({
        status: 'running',
        startedAt: claimedAt,
        timeoutAt,

        claimedBy: workerId,
        claimedAt,
        leaseExpiresAt,

        finishedAt: null,
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(jobRuns.id, id),
          eq(jobRuns.status, 'queued'),
          lte(jobRuns.availableAt, claimedAt),
          or(isNull(jobRuns.leaseExpiresAt), lte(jobRuns.leaseExpiresAt, claimedAt)),
        ),
      )
      .returning();

    return claimed ?? null;
  }

  async recoverExpiredLeases(now: Date): Promise<JobRun[]> {
    return this.database.db
      .update(jobRuns)
      .set({
        status: 'queued',

        startedAt: null,
        timeoutAt: null,

        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,

        finishedAt: null,
        errorCode: null,
        errorMessage: null,
      })
      .where(
        and(
          eq(jobRuns.status, 'running'),
          isNotNull(jobRuns.leaseExpiresAt),
          lte(jobRuns.leaseExpiresAt, now),
        ),
      )
      .returning();
  }

  async createScheduledRunIfAbsent(run: NewJobRun): Promise<JobRun | null> {
    const [created] = await this.database.db
      .insert(jobRuns)
      .values(run)
      .onConflictDoNothing({
        target: [jobRuns.scheduleId, jobRuns.scheduledFor, jobRuns.attempt],
      })
      .returning();

    return created ?? null;
  }

  async advanceSchedule(
    scheduleId: string,
    expectedNextRunAt: Date,
    lastRunAt: Date,
    nextRunAt: Date | null,
  ): Promise<JobSchedule | null> {
    const [updated] = await this.database.db
      .update(jobSchedules)
      .set({
        lastRunAt,
        nextRunAt,
        isEnabled: nextRunAt === null ? false : true,
        updatedAt: new Date(),
      })
      .where(and(eq(jobSchedules.id, scheduleId), eq(jobSchedules.nextRunAt, expectedNextRunAt)))
      .returning();

    return updated ?? null;
  }
}
