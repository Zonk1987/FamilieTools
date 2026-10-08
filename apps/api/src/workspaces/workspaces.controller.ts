import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspacesService } from './workspaces.service.js';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @RequirePlatformCapability('platform.workspaces.read')
  @ApiOkResponse({
    description: 'Workspaces returned successfully.',
  })
  async getWorkspaces() {
    return this.workspacesService.getWorkspaces();
  }

  @Get(':id')
  @RequirePlatformCapability('platform.workspaces.read')
  @ApiOkResponse({
    description: 'Workspace found.',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found.',
  })
  async getWorkspaceById(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceById(id);
  }

  @Post()
  @RequirePlatformCapability('platform.workspaces.manage')
  @ApiCreatedResponse({
    description: 'Workspace created successfully.',
  })
  async createWorkspace(@Body() body: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(body);
  }

  @Patch(':id')
  @RequirePlatformCapability('platform.workspaces.manage')
  @ApiOkResponse({
    description: 'Workspace updated successfully.',
  })
  async updateWorkspace(@Param('id') id: string, @Body() body: UpdateWorkspaceDto) {
    return this.workspacesService.updateWorkspace(id, body);
  }

  @Delete(':id')
  @RequirePlatformCapability('platform.workspaces.manage')
  @ApiOkResponse({
    description: 'Workspace deleted successfully.',
  })
  async deleteWorkspace(@Param('id') id: string) {
    await this.workspacesService.deleteWorkspace(id);

    return {
      success: true,
    };
  }
}
