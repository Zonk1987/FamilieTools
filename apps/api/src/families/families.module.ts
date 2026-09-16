import { Module } from '@nestjs/common';

import { FamiliesController } from './families.controller.js';
import { FamiliesRepository } from './families.repository.js';
import { FamiliesService } from './families.service.js';

@Module({
  controllers: [FamiliesController],
  providers: [FamiliesRepository, FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
