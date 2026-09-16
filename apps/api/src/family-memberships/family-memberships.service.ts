import { Injectable } from '@nestjs/common';

import { FamilyMembership, FamilyMembershipsRepository } from './family-memberships.repository.js';

@Injectable()
export class FamilyMembershipsService {
  constructor(private readonly familyMembershipsRepository: FamilyMembershipsRepository) {}

  async addUserToFamily(familyId: string, userId: string): Promise<FamilyMembership> {
    const existingMembership = await this.familyMembershipsRepository.findByFamilyAndUser(
      familyId,
      userId,
    );

    if (existingMembership) {
      return existingMembership;
    }

    return this.familyMembershipsRepository.create({
      familyId,
      userId,
    });
  }
}
