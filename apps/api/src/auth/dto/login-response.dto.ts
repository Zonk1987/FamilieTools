import { ApiProperty } from '@nestjs/swagger';

import { AuthUserDto } from './auth-user.dto.js';

export class LoginResponseDto {
  @ApiProperty({
    type: AuthUserDto,
  })
  user!: AuthUserDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  expiresAt!: Date;
}
