import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'sebastian',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  loginName!: string;

  @ApiProperty({
    example: 'correct-horse-battery-staple',
    maxLength: 200,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
