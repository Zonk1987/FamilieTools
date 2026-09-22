import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PasswordService } from '../users/password.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  async login(loginName: string, password: string) {
    const normalizedLoginName = loginName.trim().toLowerCase();

    const user = await this.usersRepository.findByLoginName(normalizedLoginName);

    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const passwordValid = await this.passwordService.verify(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const token = randomBytes(32).toString('base64url');

    const tokenHash = hashSessionToken(token);

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

    await this.authSessionsRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        loginName: user.loginName,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async authenticate(token: string) {
    const tokenHash = hashSessionToken(token);

    const session = await this.authSessionsRepository.findValidByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    await this.authSessionsRepository.touch(session.sessionId);

    return {
      id: session.userId,
      loginName: session.loginName,
      displayName: session.displayName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async logout(token: string): Promise<void> {
    const tokenHash = hashSessionToken(token);

    await this.authSessionsRepository.deleteByTokenHash(tokenHash);
  }
}
