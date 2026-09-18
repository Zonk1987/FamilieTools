import { Module } from '@nestjs/common';

import { PlatformCapabilityGuard } from './platform-capability.guard.js';
import { PlatformAuthService } from './platform-auth.service.js';

@Module({
  providers: [PlatformAuthService, PlatformCapabilityGuard],
  exports: [PlatformAuthService, PlatformCapabilityGuard],
})
export class PlatformAuthModule {}
