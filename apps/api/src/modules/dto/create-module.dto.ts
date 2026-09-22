import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'org.familietools.calendar',
  })
  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  @ApiProperty({
    example: '1.0.0',
  })
  @IsString()
  @IsNotEmpty()
  version!: string;

  @ApiProperty({
    example: 'Calendar',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Shared family calendar and scheduling.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    example: 'FamilieTools',
  })
  @IsString()
  @IsNotEmpty()
  publisher!: string;

  @ApiProperty({
    example: '/data/modules/org.familietools.calendar/1.0.0',
  })
  @IsString()
  @IsNotEmpty()
  installationPath!: string;

  @ApiProperty({
    example: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  })
  @IsString()
  @IsNotEmpty()
  packageSha256!: string;

  @ApiPropertyOptional({
    example: 'local',
    default: 'local',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  installSource?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  manifest!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
