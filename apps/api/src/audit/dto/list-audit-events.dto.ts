import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListAuditEventsDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 25,
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    example: 'auth.login.failed',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    enum: ['success', 'failure', 'denied'],
    example: 'failure',
  })
  @IsOptional()
  @IsIn(['success', 'failure', 'denied'])
  result?: 'success' | 'failure' | 'denied';

  @ApiPropertyOptional({
    example: 'user',
  })
  @IsOptional()
  @IsString()
  actorType?: string;

  @ApiPropertyOptional({
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({
    example: 'platform',
  })
  @IsOptional()
  @IsString()
  scopeType?: string;

  @ApiPropertyOptional({
    example: '11111111-1111-4111-8111-111111111111',
  })
  @IsOptional()
  @IsString()
  scopeId?: string;

  @ApiPropertyOptional({
    example: 'auth-session',
  })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({
    example: 'session-123',
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    example: 'request-123',
  })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdFrom?: Date;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.999Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdTo?: Date;
}
