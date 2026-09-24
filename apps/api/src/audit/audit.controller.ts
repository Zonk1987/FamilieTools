import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { RequirePlatformCapability } from '../platform-auth/require-platform-capability.decorator.js';
import { AuditService } from './audit.service.js';
import { AuditLogListResponseDto } from './dto/audit-log-list-response.dto.js';
import { ListAuditEventsDto } from './dto/list-audit-events.dto.js';

@ApiTags('Audit')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePlatformCapability('platform.audit.read')
  @ApiOkResponse({
    description: 'Returns paginated platform audit events.',
    type: AuditLogListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required.',
  })
  @ApiForbiddenResponse({
    description: 'Missing platform.audit.read capability.',
  })
  async getAuditEvents(@Query() query: ListAuditEventsDto) {
    return this.auditService.list(query);
  }
}
