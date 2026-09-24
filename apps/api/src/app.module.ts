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
import { ThemesModule } from './themes/themes.module.js';
import { UserPreferencesModule } from './user-preferences/user-preferences.module.js';
import { ModulesModule } from './modules/modules.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { PlatformThrottlerGuard } from './security/platform-throttler.guard.js';
import { CsrfOriginGuard } from './security/csrf-origin.guard.js';
import { AuditModule } from './audit/audit.module.js';

import { APP_GUARD } from '@nestjs/core';

import { SessionAuthGuard } from './auth/session-auth.guard.js';
import { PlatformCapabilityGuard } from './platform-auth/platform-capability.guard.js';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
        {
          name: 'authIpBurst',
          ttl: 60_000,
          limit: 10,
          blockDuration: 60_000,
          skipIf: (context) => context.getHandler().name !== 'login',
        },
        {
          name: 'authIpSustained',
          ttl: 15 * 60_000,
          limit: 30,
          blockDuration: 15 * 60_000,
          skipIf: (context) => context.getHandler().name !== 'login',
        },
        {
          name: 'authAccountBurst',
          ttl: 60_000,
          limit: 8,
          blockDuration: 60_000,
          skipIf: (context) => context.getHandler().name !== 'login',
        },
        {
          name: 'authAccountSustained',
          ttl: 15 * 60_000,
          limit: 20,
          blockDuration: 5 * 60_000,
          skipIf: (context) => context.getHandler().name !== 'login',
        },
      ],
    }),
    PlatformStateModule,
    ThemesModule,
    AuditModule,
    HealthModule,
    UserPreferencesModule,
    AuthModule,
    ModulesModule,
    SetupModule,
    UsersModule,
    InstanceSettingsModule,
    FamiliesModule,
    FamilyMembershipsModule,
    PlatformAuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: PlatformThrottlerGuard },
    { provide: APP_GUARD, useExisting: SessionAuthGuard },
    { provide: APP_GUARD, useExisting: PlatformCapabilityGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
  ],
})
export class AppModule {}
