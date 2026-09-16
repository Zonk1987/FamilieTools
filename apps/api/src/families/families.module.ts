import { Module } from '@nestjs/common';

import { FamiliesRepository } from './families.repository.js';
import { FamiliesService } from './families.service.js';

@Module({
  providers: [FamiliesRepository, FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
