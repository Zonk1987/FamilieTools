import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'sebastian',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  loginName!: string;

  @ApiProperty({
    example: 'Sebastian',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({
    example: 'correct-horse-battery-staple',
    minLength: 12,
    maxLength: 200,
    writeOnly: true,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(200)
  password!: string;
}
