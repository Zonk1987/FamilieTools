import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { FamiliesModule } from './families/families.module.js';
import { FamilyMembershipsModule } from './family-memberships/family-memberships.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';
import { PlatformAuthModule } from './platform-auth/platform-auth.module.js';
import { PlatformStateModule } from './platform-state/platform-state.module.js';
import { SetupModule } from './setup/setup.module.js';
import { InstanceSettingsModule } from './instance-settings/instance-settings.module.js';

@Module({
  imports: [
    DatabaseModule,
    PlatformStateModule,
    HealthModule,
    SetupModule,
    UsersModule,
    InstanceSettingsModule,
    FamiliesModule,
    FamilyMembershipsModule,
    PlatformAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
