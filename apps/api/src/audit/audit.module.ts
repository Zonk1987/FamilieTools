import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { AuditController } from './audit.controller.js';
import { AuditRepository } from './audit.repository.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService],
  exports: [AuditRepository, AuditService],
})
export class AuditModule {}
