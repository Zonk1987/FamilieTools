import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';
import { WorkspaceMembershipsController } from './workspace-memberships.controller.js';
import { WorkspaceMembershipsRepository } from './workspace-memberships.repository.js';
import { WorkspaceMembershipsService } from './workspace-memberships.service.js';

@Module({
  imports: [UsersModule, WorkspacesModule],
  controllers: [WorkspaceMembershipsController],
  providers: [WorkspaceMembershipsRepository, WorkspaceMembershipsService],
  exports: [WorkspaceMembershipsRepository, WorkspaceMembershipsService],
})
export class WorkspaceMembershipsModule {}
