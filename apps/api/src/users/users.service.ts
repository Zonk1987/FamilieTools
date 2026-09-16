import { Injectable } from '@nestjs/common';

import { NewUser, User, UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(displayName: string): Promise<User> {
    const normalizedDisplayName = displayName.trim();

    if (!normalizedDisplayName) {
      throw new Error('Display name must not be empty');
    }

    const data: NewUser = {
      displayName: normalizedDisplayName,
    };

    return this.usersRepository.create(data);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
