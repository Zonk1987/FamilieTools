import { Injectable } from '@nestjs/common';

import { FamiliesRepository, Family, NewFamily } from './families.repository.js';
import type { DatabaseExecutor } from '../database/database.service.js';

@Injectable()
export class FamiliesService {
  constructor(private readonly familiesRepository: FamiliesRepository) {}

  async createFamily(name: string, database?: DatabaseExecutor): Promise<Family> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error('Family name must not be empty');
    }

    const data: NewFamily = {
      name: normalizedName,
    };

    return database
      ? this.familiesRepository.create(data, database)
      : this.familiesRepository.create(data);
  }

  async findFamilyById(id: string, database?: DatabaseExecutor): Promise<Family | null> {
    return this.familiesRepository.findById(id, database);
  }
}
