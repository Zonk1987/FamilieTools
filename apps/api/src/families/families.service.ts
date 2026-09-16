import { Injectable } from '@nestjs/common';

import { FamiliesRepository, Family, NewFamily } from './families.repository.js';

@Injectable()
export class FamiliesService {
  constructor(private readonly familiesRepository: FamiliesRepository) {}

  async createFamily(name: string): Promise<Family> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error('Family name must not be empty');
    }

    const data: NewFamily = {
      name: normalizedName,
    };

    return this.familiesRepository.create(data);
  }

  async findFamilyById(id: string): Promise<Family | null> {
    return this.familiesRepository.findById(id);
  }
}
