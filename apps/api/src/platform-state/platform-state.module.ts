import { Module } from '@nestjs/common';

import { PlatformStateService } from './platform-state.service.js';

@Module({
  providers: [PlatformStateService],
  exports: [PlatformStateService],
})
export class PlatformStateModule {}
