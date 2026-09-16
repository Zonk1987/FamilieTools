import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { FamiliesModule } from './families/families.module.js';
import { FamilyMembershipsModule } from './family-memberships/family-memberships.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [DatabaseModule, HealthModule, UsersModule, FamiliesModule, FamilyMembershipsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
