import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogEntryDto {
  @ApiProperty({
    example: '11111111-1111-4111-8111-111111111111',
  })
  id!: string;

  @ApiProperty({
    example: 'user',
  })
  actorType!: string;

  @ApiPropertyOptional({
    example: 'user-123',
    nullable: true,
  })
  actorId!: string | null;

  @ApiPropertyOptional({
    example: 'platform',
    nullable: true,
  })
  scopeType!: string | null;

  @ApiPropertyOptional({
    example: '11111111-1111-4111-8111-111111111111',
    nullable: true,
  })
  scopeId!: string | null;

  @ApiProperty({
    example: 'auth.login.succeeded',
  })
  action!: string;

  @ApiPropertyOptional({
    example: 'auth-session',
    nullable: true,
  })
  targetType!: string | null;

  @ApiPropertyOptional({
    example: 'session-123',
    nullable: true,
  })
  targetId!: string | null;

  @ApiProperty({
    enum: ['success', 'failure', 'denied'],
    example: 'success',
  })
  result!: 'success' | 'failure' | 'denied';

  @ApiPropertyOptional({
    example: 'request-123',
    nullable: true,
  })
  requestId!: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      reason: 'invalid_credentials',
    },
  })
  metadata!: Record<string, unknown>;

  @ApiProperty({
    example: '2026-09-24T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}
