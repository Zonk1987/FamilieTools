import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';

import { CreateFamilyDto } from './dto/create-family.dto.js';
import { FamiliesService } from './families.service.js';

@ApiTags('Families')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @RequirePlatformCapability('platform.families.manage')
  @ApiCreatedResponse({
    description: 'Family created successfully.',
  })
  async create(@Body() dto: CreateFamilyDto) {
    return this.familiesService.createFamily(dto.name);
  }

  @Get(':id')
  @RequirePlatformCapability('platform.families.read')
  @ApiOkResponse({
    description: 'Family found.',
  })
  @ApiNotFoundResponse({
    description: 'Family not found.',
  })
  async findById(@Param('id') id: string) {
    const family = await this.familiesService.findFamilyById(id);

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }
}
