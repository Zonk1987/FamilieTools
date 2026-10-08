import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';
import { CreateWorkspaceMembershipDto } from './dto/create-workspace-membership.dto.js';
import { WorkspaceMembershipsService } from './workspace-memberships.service.js';

@ApiTags('Workspace Memberships')
@Controller('workspace-memberships')
export class WorkspaceMembershipsController {
  constructor(private readonly workspaceMembershipsService: WorkspaceMembershipsService) {}

  @Post()
  @RequirePlatformCapability('platform.workspaces.manage')
  @ApiCreatedResponse({
    description: 'Workspace membership created or returned if it already exists.',
  })
  async create(@Body() body: CreateWorkspaceMembershipDto) {
    return this.workspaceMembershipsService.addUserToWorkspace(body.workspaceId, body.userId);
  }

  @Get('workspace/:workspaceId')
  @RequirePlatformCapability('platform.workspaces.read')
  @ApiOkResponse({
    description: 'Workspace memberships returned successfully.',
  })
  async getWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspaceMembershipsService.getWorkspaceMembers(workspaceId);
  }

  @Get('user/:userId')
  @RequirePlatformCapability('platform.workspaces.read')
  @ApiOkResponse({
    description: 'User workspace memberships returned successfully.',
  })
  async getUserWorkspaces(@Param('userId') userId: string) {
    return this.workspaceMembershipsService.getUserWorkspaces(userId);
  }

  @Delete(':workspaceId/:userId')
  @RequirePlatformCapability('platform.workspaces.manage')
  @ApiOkResponse({
    description: 'Workspace membership removed successfully.',
  })
  async remove(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string) {
    await this.workspaceMembershipsService.removeUserFromWorkspace(workspaceId, userId);

    return {
      success: true,
    };
  }
}
