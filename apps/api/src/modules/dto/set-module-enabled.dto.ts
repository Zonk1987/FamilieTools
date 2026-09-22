import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetModuleEnabledDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;
}
