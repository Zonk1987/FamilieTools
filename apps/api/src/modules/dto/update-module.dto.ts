import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateModuleDto {
  @ApiPropertyOptional({
    example: 'Calendar',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'Shared family calendar and scheduling.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;
}
