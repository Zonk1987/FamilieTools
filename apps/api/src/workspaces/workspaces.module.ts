import { Module } from '@nestjs/common';

import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesRepository } from './workspaces.repository.js';
import { WorkspacesService } from './workspaces.service.js';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesRepository, WorkspacesService],
  exports: [WorkspacesRepository, WorkspacesService],
})
export class WorkspacesModule {}
