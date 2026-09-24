import { Module } from '@nestjs/common';

import { JobExecutor } from './job.executor.js';
import { JobHandlerRegistry } from './job-handler.registry.js';
import { JobRepository } from './job.repository.js';
import { JobSchedulerService } from './job-scheduler.service.js';
import { JobService } from './job.service.js';

@Module({
  providers: [JobRepository, JobHandlerRegistry, JobService, JobExecutor, JobSchedulerService],
  exports: [JobRepository, JobHandlerRegistry, JobService, JobExecutor, JobSchedulerService],
})
export class JobsModule {}
