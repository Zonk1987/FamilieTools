import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { CreateFamilyMembershipDto } from './dto/create-family-membership.dto.js';
import { FamilyMembershipsService } from './family-memberships.service.js';

@ApiTags('Family Memberships')
@Controller('family-memberships')
export class FamilyMembershipsController {
  constructor(private readonly familyMembershipsService: FamilyMembershipsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Family membership created or returned if it already exists.',
  })
  async create(@Body() dto: CreateFamilyMembershipDto) {
    return this.familyMembershipsService.addUserToFamily(dto.familyId, dto.userId);
  }
}
