import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { ThemesRepository } from './themes.repository.js';
import { ThemesService } from './themes.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [ThemesRepository, ThemesService],
  exports: [ThemesRepository, ThemesService],
})
export class ThemesModule {}
