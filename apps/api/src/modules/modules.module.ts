import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { ModulesController } from './modules.controller.js';
import { ModulesRepository } from './modules.repository.js';
import { ModulesSeed } from './modules.seed.js';
import { ModulesService } from './modules.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ModulesController],
  providers: [ModulesRepository, ModulesService, ModulesSeed],
  exports: [ModulesRepository, ModulesService, ModulesSeed],
})
export class ModulesModule {}
