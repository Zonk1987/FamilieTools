import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';
import { CreateThemeDto } from './dto/create-theme.dto.js';
import { SetThemeEnabledDto } from './dto/set-theme-enabled.dto.js';
import { UpdateThemeDto } from './dto/update-theme.dto.js';
import { ThemesService } from './themes.service.js';

@Controller('admin/themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  @RequirePlatformCapability('platform.themes.read')
  async getThemes() {
    return this.themesService.getThemes();
  }

  @Get('enabled')
  @RequirePlatformCapability('platform.themes.read')
  async getEnabledThemes() {
    return this.themesService.getEnabledThemes();
  }

  @Get('default')
  @RequirePlatformCapability('platform.themes.read')
  async getDefaultTheme() {
    return this.themesService.getDefaultTheme();
  }

  @Get(':id')
  @RequirePlatformCapability('platform.themes.read')
  async getThemeById(@Param('id') id: string) {
    return this.themesService.getThemeById(id);
  }

  @Post()
  @RequirePlatformCapability('platform.themes.manage')
  async createTheme(@Body() body: CreateThemeDto) {
    return this.themesService.createTheme(body);
  }

  @Patch(':id')
  @RequirePlatformCapability('platform.themes.manage')
  async updateTheme(@Param('id') id: string, @Body() body: UpdateThemeDto) {
    return this.themesService.updateTheme(id, body);
  }

  @Patch(':id/enabled')
  @RequirePlatformCapability('platform.themes.manage')
  async setThemeEnabled(@Param('id') id: string, @Body() body: SetThemeEnabledDto) {
    return this.themesService.setThemeEnabled(id, body.enabled);
  }

  @Patch(':id/default')
  @RequirePlatformCapability('platform.themes.manage')
  async setDefaultTheme(@Param('id') id: string) {
    return this.themesService.setDefaultTheme(id);
  }

  @Delete(':id')
  @RequirePlatformCapability('platform.themes.manage')
  async deleteTheme(@Param('id') id: string) {
    await this.themesService.deleteTheme(id);

    return {
      success: true,
    };
  }
}
