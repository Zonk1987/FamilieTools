import { Injectable } from '@nestjs/common';

import { NewUser, User, UsersRepository } from './users.repository.js';
import type { DatabaseExecutor } from '../database/database.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(displayName: string, database?: DatabaseExecutor): Promise<User> {
    const normalizedDisplayName = displayName.trim();

    if (!normalizedDisplayName) {
      throw new Error('Display name must not be empty');
    }

    const data: NewUser = {
      displayName: normalizedDisplayName,
    };

    return database
      ? this.usersRepository.create(data, database)
      : this.usersRepository.create(data);
  }

  async findUserById(id: string, database?: DatabaseExecutor): Promise<User | null> {
    return this.usersRepository.findById(id, database);
  }
}
