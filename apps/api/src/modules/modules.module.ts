import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { ModulesController } from './modules.controller.js';
import { ModulesRepository } from './modules.repository.js';
import { ModulesService } from './modules.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ModulesController],
  providers: [ModulesRepository, ModulesService],
  exports: [ModulesRepository, ModulesService],
})
export class ModulesModule {}
