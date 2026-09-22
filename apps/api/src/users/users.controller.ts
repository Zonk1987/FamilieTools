import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePlatformCapability('platform.users.manage')
  @ApiCreatedResponse({
    description: 'User created successfully.',
  })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser({
      loginName: dto.loginName,
      displayName: dto.displayName,
      password: dto.password,
    });
  }

  @Get(':id')
  @RequirePlatformCapability('platform.users.read')
  @ApiOkResponse({
    description: 'User found.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
