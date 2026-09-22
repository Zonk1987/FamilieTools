import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service.js';

const SESSION_COOKIE_NAME = 'familietools_session';

type SessionUser = Awaited<ReturnType<AuthService['authenticate']>>;

type SessionRequest = FastifyRequest & {
  cookies?: Record<string, string>;
  user?: SessionUser;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();

    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
      return true;
    }

    const user = await this.authService.authenticate(token);

    if (user) {
      request.user = user;
    }

    return true;
  }
}
