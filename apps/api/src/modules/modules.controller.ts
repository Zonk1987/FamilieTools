import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';
import { CreateModuleDto } from './dto/create-module.dto.js';
import { SetModuleEnabledDto } from './dto/set-module-enabled.dto.js';
import { UpdateModuleDto } from './dto/update-module.dto.js';
import { ModulesService } from './modules.service.js';

@Controller('admin/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @RequirePlatformCapability('platform.modules.read')
  async getModules() {
    return this.modulesService.getModules();
  }

  @Get('enabled')
  @RequirePlatformCapability('platform.modules.read')
  async getEnabledModules() {
    return this.modulesService.getEnabledModules();
  }

  @Get(':id')
  @RequirePlatformCapability('platform.modules.read')
  async getModuleById(@Param('id') id: string) {
    return this.modulesService.getModuleById(id);
  }

  @Post()
  @RequirePlatformCapability('platform.modules.manage')
  async createModule(@Body() body: CreateModuleDto) {
    return this.modulesService.createModule(body);
  }

  @Patch(':id')
  @RequirePlatformCapability('platform.modules.manage')
  async updateModule(@Param('id') id: string, @Body() body: UpdateModuleDto) {
    return this.modulesService.updateModule(id, body);
  }

  @Patch(':id/enabled')
  @RequirePlatformCapability('platform.modules.manage')
  async setModuleEnabled(@Param('id') id: string, @Body() body: SetModuleEnabledDto) {
    return this.modulesService.setModuleEnabled(id, body.enabled);
  }

  @Delete(':id')
  @RequirePlatformCapability('platform.modules.manage')
  async deleteModule(@Param('id') id: string) {
    await this.modulesService.deleteModule(id);

    return {
      success: true,
    };
  }
}
