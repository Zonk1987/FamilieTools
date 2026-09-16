import { Module } from '@nestjs/common';

import { FamilyMembershipsController } from './family-memberships.controller.js';
import { FamilyMembershipsRepository } from './family-memberships.repository.js';
import { FamilyMembershipsService } from './family-memberships.service.js';

@Module({
  controllers: [FamilyMembershipsController],
  providers: [FamilyMembershipsRepository, FamilyMembershipsService],
  exports: [FamilyMembershipsService],
})
export class FamilyMembershipsModule {}
