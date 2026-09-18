import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { PlatformCapability } from './platform-capabilities.js';
import { PlatformAuthService } from './platform-auth.service.js';
import { PLATFORM_CAPABILITY_METADATA_KEY } from './require-platform-capability.decorator.js';

type RequestWithUser = {
  user?: {
    id?: string;
  };
};

@Injectable()
export class PlatformCapabilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly platformAuthService: PlatformAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCapability = this.reflector.getAllAndOverride<PlatformCapability>(
      PLATFORM_CAPABILITY_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCapability) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const allowed = await this.platformAuthService.hasCapability(userId, requiredCapability);

    if (!allowed) {
      throw new ForbiddenException('Missing platform capability');
    }

    return true;
  }
}
