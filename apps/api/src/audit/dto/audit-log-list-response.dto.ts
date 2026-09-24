import { ApiProperty } from '@nestjs/swagger';

import { AuditLogEntryDto } from './audit-log-entry.dto.js';

export class AuditLogListResponseDto {
  @ApiProperty({
    type: [AuditLogEntryDto],
  })
  items!: AuditLogEntryDto[];

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 25,
  })
  pageSize!: number;

  @ApiProperty({
    example: 100,
  })
  total!: number;
}
