import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';

type HttpRequest = {
  ip?: unknown;
  body?: unknown;
};

type LoginBody = {
  loginName?: unknown;
};

function hashLoginName(loginName: string): string {
  return createHash('sha256').update(loginName.trim().toLowerCase()).digest('hex');
}

@Injectable()
export class PlatformThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Record<string, unknown>): Promise<string> {
    const ip = request.ip;

    if (typeof ip !== 'string' || ip.length === 0) {
      return 'unknown-client';
    }

    return ip;
  }

  protected generateKey(context: ExecutionContext, tracker: string, throttlerName: string): string {
    if (throttlerName !== 'authAccountBurst' && throttlerName !== 'authAccountSustained') {
      return super.generateKey(context, tracker, throttlerName);
    }

    const request = context.switchToHttp().getRequest<HttpRequest>();

    const body =
      request.body && typeof request.body === 'object' ? (request.body as LoginBody) : undefined;

    const loginName = body?.loginName;

    const accountTracker =
      typeof loginName === 'string' && loginName.trim().length > 0
        ? `account:${hashLoginName(loginName)}`
        : 'account:invalid';

    return super.generateKey(context, accountTracker, throttlerName);
  }
}
