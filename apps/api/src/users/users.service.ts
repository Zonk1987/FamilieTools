import { ConflictException, Injectable } from '@nestjs/common';

import type { DatabaseExecutor } from '../database/database.service.js';
import { type User, UsersRepository } from './users.repository.js';
import { PasswordService } from './password.service.js';

export type CreateUserInput = {
  loginName: string;
  displayName: string;
  password: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async createUser(input: CreateUserInput, database?: DatabaseExecutor): Promise<User> {
    const loginName = input.loginName.trim().toLowerCase();

    const displayName = input.displayName.trim();

    if (!loginName) {
      throw new ConflictException('Login name must not be empty');
    }

    if (!displayName) {
      throw new ConflictException('Display name must not be empty');
    }

    if (input.password.length < 12) {
      throw new ConflictException('Password must contain at least 12 characters');
    }

    const existing = await this.usersRepository.findByLoginName(loginName, database);

    if (existing) {
      throw new ConflictException('Login name already exists');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    return this.usersRepository.create(
      {
        loginName,
        displayName,
        passwordHash,
      },
      database,
    );
  }

  async findUserById(id: string, database?: DatabaseExecutor): Promise<User | null> {
    return this.usersRepository.findById(id, database);
  }
}
