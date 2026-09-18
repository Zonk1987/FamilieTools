import { Module } from '@nestjs/common';

import { FamilyMembershipsModule } from '../family-memberships/family-memberships.module.js';
import { FamiliesModule } from '../families/families.module.js';
import { InstanceSettingsModule } from '../instance-settings/instance-settings.module.js';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module.js';
import { PlatformStateModule } from '../platform-state/platform-state.module.js';
import { UsersModule } from '../users/users.module.js';
import { SetupController } from './setup.controller.js';
import { SetupService } from './setup.service.js';

@Module({
  imports: [
    PlatformStateModule,
    InstanceSettingsModule,
    UsersModule,
    FamiliesModule,
    FamilyMembershipsModule,
    PlatformAuthModule,
  ],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
