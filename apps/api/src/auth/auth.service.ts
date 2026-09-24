import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../database/database.service.js';
import { PasswordService } from '../users/password.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';
import {
  CORE_AUDIT_ACTIONS,
  CORE_AUDIT_ACTOR_TYPES,
  CORE_AUDIT_SCOPE_TYPES,
  CORE_AUDIT_TARGET_TYPES,
  CORE_AUDIT_RESULTS,
} from '../audit/audit.events.js';

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

const SESSION_TOUCH_INTERVAL_MS = 10 * 60 * 1000;

const SESSION_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$lEiN0nH-Rp0riOoyGugWioaHUE-NnL__ctR30z71WYE$lqybC6lSrQphUbe0DWbCj6DJQkHdeAJNdliujNL3sBXLgCjZIJOI5Gqfrn-oE_VzNLr3E3ZtIWjDv2wH1rFz7w';

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async login(loginName: string, password: string, requestId?: string) {
    const normalizedLoginName = loginName.trim().toLowerCase();

    const user = await this.usersRepository.findByLoginName(normalizedLoginName);

    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;

    const passwordValid = await this.passwordService.verify(password, passwordHash);

    if (!user || !passwordValid) {
      await this.auditService.append({
        actor: {
          type: CORE_AUDIT_ACTOR_TYPES.ANONYMOUS,
        },
        scope: {
          type: CORE_AUDIT_SCOPE_TYPES.PLATFORM,
        },
        action: CORE_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: CORE_AUDIT_RESULTS.FAILURE,
        requestId,
        metadata: {
          reason: 'invalid_credentials',
        },
      });

      throw new UnauthorizedException('Invalid login credentials');
    }

    const token = randomBytes(32).toString('base64url');

    const tokenHash = hashSessionToken(token);

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

    const session = await this.databaseService.transaction(async (transaction) => {
      const createdSession = await this.authSessionsRepository.create(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        transaction,
      );

      await this.auditService.append(
        {
          actor: {
            type: CORE_AUDIT_ACTOR_TYPES.USER,
            id: user.id,
          },
          scope: {
            type: CORE_AUDIT_SCOPE_TYPES.PLATFORM,
          },
          action: CORE_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
          result: CORE_AUDIT_RESULTS.SUCCESS,
          requestId,
          target: {
            type: CORE_AUDIT_TARGET_TYPES.AUTH_SESSION,
            id: createdSession.id,
          },
        },
        transaction,
      );

      return createdSession;
    });

    return {
      token,
      expiresAt,
      sessionId: session.id,
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

    const now = new Date();

    const idleAfter = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS);

    const session = await this.authSessionsRepository.findValidByTokenHash(tokenHash, idleAfter);

    if (!session) {
      return null;
    }

    const staleBefore = new Date(now.getTime() - SESSION_TOUCH_INTERVAL_MS);

    if (session.lastSeenAt < staleBefore) {
      await this.authSessionsRepository.touchIfStale(session.sessionId, staleBefore);
    }

    return {
      id: session.userId,
      loginName: session.loginName,
      displayName: session.displayName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async logout(token: string, actorUserId?: string, requestId?: string): Promise<void> {
    const tokenHash = hashSessionToken(token);

    await this.databaseService.transaction(async (transaction) => {
      await this.authSessionsRepository.deleteByTokenHash(tokenHash, transaction);

      await this.auditService.append(
        {
          actor: actorUserId
            ? {
                type: CORE_AUDIT_ACTOR_TYPES.USER,
                id: actorUserId,
              }
            : {
                type: CORE_AUDIT_ACTOR_TYPES.ANONYMOUS,
              },
          scope: {
            type: CORE_AUDIT_SCOPE_TYPES.PLATFORM,
          },
          action: CORE_AUDIT_ACTIONS.AUTH_LOGOUT,
          result: CORE_AUDIT_RESULTS.SUCCESS,
          requestId,
        },
        transaction,
      );
    });
  }

  async cleanupExpiredSessions(now: Date = new Date()): Promise<number> {
    return this.authSessionsRepository.deleteExpired(now);
  }
}
