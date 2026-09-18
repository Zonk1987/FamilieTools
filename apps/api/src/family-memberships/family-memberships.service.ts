import { Injectable } from '@nestjs/common';

import { FamilyMembership, FamilyMembershipsRepository } from './family-memberships.repository.js';
import type { DatabaseExecutor } from '../database/database.service.js';

@Injectable()
export class FamilyMembershipsService {
  constructor(private readonly familyMembershipsRepository: FamilyMembershipsRepository) {}

  async addUserToFamily(
    familyId: string,
    userId: string,
    database?: DatabaseExecutor,
  ): Promise<FamilyMembership> {
    const existingMembership = database
      ? await this.familyMembershipsRepository.findByFamilyAndUser(familyId, userId, database)
      : await this.familyMembershipsRepository.findByFamilyAndUser(familyId, userId);

    if (existingMembership) {
      return existingMembership;
    }

    const data = {
      familyId,
      userId,
    };

    return database
      ? this.familyMembershipsRepository.create(data, database)
      : this.familyMembershipsRepository.create(data);
  }
}
