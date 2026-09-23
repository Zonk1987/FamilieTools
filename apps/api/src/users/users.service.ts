import { ConflictException, Injectable } from '@nestjs/common';

import type { DatabaseExecutor } from '../database/database.service.js';
import { type User, UsersRepository } from './users.repository.js';
import { PasswordService } from './password.service.js';

export type CreateUserInput = {
  loginName: string;
  displayName: string;
  password: string;
};

function isPostgresUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

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

    try {
      return await this.usersRepository.create(
        {
          loginName,
          displayName,
          passwordHash,
        },
        database,
      );
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException('Login name already exists');
      }

      throw error;
    }
  }

  async findUserById(id: string, database?: DatabaseExecutor): Promise<User | null> {
    return this.usersRepository.findById(id, database);
  }
}
