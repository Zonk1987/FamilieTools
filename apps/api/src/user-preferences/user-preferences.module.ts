import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { ThemesModule } from '../themes/themes.module.js';
import { UsersModule } from '../users/users.module.js';
import { UserPreferencesRepository } from './user-preferences.repository.js';
import { UserPreferencesService } from './user-preferences.service.js';

@Module({
  imports: [DatabaseModule, ThemesModule, UsersModule],
  providers: [UserPreferencesRepository, UserPreferencesService],
  exports: [UserPreferencesRepository, UserPreferencesService],
})
export class UserPreferencesModule {}
