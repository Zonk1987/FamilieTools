import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { isAllowedWebOrigin } from './web-origins.js';

import { SESSION_COOKIE_NAME } from '../auth/auth.constants.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type CookieRequest = FastifyRequest & {
  cookies?: Record<string, string>;
};

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CookieRequest>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return true;
    }

    const originHeader = request.headers.origin;

    if (typeof originHeader === 'string') {
      if (isAllowedWebOrigin(originHeader)) {
        return true;
      }

      throw new ForbiddenException('Cross-origin request rejected');
    }

    const refererHeader = request.headers.referer;

    if (typeof refererHeader === 'string') {
      try {
        const refererOrigin = new URL(refererHeader).origin;

        if (isAllowedWebOrigin(refererOrigin)) {
          return true;
        }
      } catch {
        throw new ForbiddenException('Invalid request origin');
      }
    }

    throw new ForbiddenException('Request origin could not be verified');
  }
}
