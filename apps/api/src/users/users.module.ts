import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { PasswordService } from './password.service.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersRepository, PasswordService, UsersService],
  exports: [UsersRepository, PasswordService, UsersService],
})
export class UsersModule {}
