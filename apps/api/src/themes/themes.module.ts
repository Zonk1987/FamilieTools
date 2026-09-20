import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { ThemesController } from './themes.controller.js';
import { ThemesRepository } from './themes.repository.js';
import { ThemesSeed } from './themes.seed.js';
import { ThemesService } from './themes.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ThemesController],
  providers: [ThemesRepository, ThemesService, ThemesSeed],
  exports: [ThemesRepository, ThemesService, ThemesSeed],
})
export class ThemesModule {}
