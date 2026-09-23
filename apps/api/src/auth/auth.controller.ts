import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthUserDto } from './dto/auth-user.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LogoutResponseDto } from './dto/logout-response.dto.js';
import { SESSION_COOKIE_NAME } from './auth.constants.js';
import { getClearSessionCookieOptions, getSessionCookieOptions } from './session-cookie.js';

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  expires?: Date;
};

type CookieRequest = FastifyRequest & {
  cookies?: Record<string, string>;
};

type CookieReply = FastifyReply & {
  setCookie(name: string, value: string, options?: CookieOptions): unknown;

  clearCookie(name: string, options?: CookieOptions): unknown;
};

type RequestWithUser = CookieRequest & {
  user?: {
    id: string;
    loginName: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Authentication successful.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid login credentials.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({
      passthrough: true,
    })
    reply: CookieReply,
  ) {
    const result = await this.authService.login(dto.loginName, dto.password);

    reply.setCookie(SESSION_COOKIE_NAME, result.token, getSessionCookieOptions(result.expiresAt));

    return {
      user: result.user,
      expiresAt: result.expiresAt,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Session ended successfully.',
    type: LogoutResponseDto,
  })
  async logout(
    @Req() request: CookieRequest,
    @Res({
      passthrough: true,
    })
    reply: CookieReply,
  ) {
    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (token) {
      await this.authService.logout(token);
    }

    reply.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

    return {
      success: true,
    };
  }

  @Get('me')
  @ApiOkResponse({
    description: 'Returns the authenticated user.',
    type: AuthUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required.',
  })
  async me(@Req() request: RequestWithUser) {
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return request.user;
  }
}
