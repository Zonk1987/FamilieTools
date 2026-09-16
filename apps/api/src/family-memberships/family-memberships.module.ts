import { Module } from '@nestjs/common';

import { FamilyMembershipsRepository } from './family-memberships.repository.js';
import { FamilyMembershipsService } from './family-memberships.service.js';

@Module({
  providers: [FamilyMembershipsRepository, FamilyMembershipsService],
  exports: [FamilyMembershipsService],
})
export class FamilyMembershipsModule {}
