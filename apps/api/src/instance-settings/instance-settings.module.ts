import { Module } from '@nestjs/common';

import { InstanceSettingsService } from './instance-settings.service.js';

@Module({
  providers: [InstanceSettingsService],
  exports: [InstanceSettingsService],
})
export class InstanceSettingsModule {}
