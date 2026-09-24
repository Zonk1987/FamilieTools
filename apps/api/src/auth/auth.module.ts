import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';
import { AuthService } from './auth.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [DatabaseModule, UsersModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthSessionsRepository, SessionAuthGuard, AuthService],
  exports: [AuthSessionsRepository, SessionAuthGuard, AuthService],
})
export class AuthModule {}
