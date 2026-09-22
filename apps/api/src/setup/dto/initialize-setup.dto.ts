import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class InitializeSetupOwnerDto {
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

export class InitializeSetupInstanceDto {
  @ApiProperty({
    example: 'FamilieTools',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'de',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  defaultLanguage!: string;

  @ApiProperty({
    example: 'Europe/Berlin',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  defaultTimezone!: string;
}

export class InitializeSetupFamilyDto {
  @ApiProperty({
    example: 'Familie Haupt',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class InitializeSetupDto {
  @ApiProperty({
    type: InitializeSetupOwnerDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => InitializeSetupOwnerDto)
  owner!: InitializeSetupOwnerDto;

  @ApiProperty({
    type: InitializeSetupInstanceDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => InitializeSetupInstanceDto)
  instance!: InitializeSetupInstanceDto;

  @ApiProperty({
    type: InitializeSetupFamilyDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => InitializeSetupFamilyDto)
  family!: InitializeSetupFamilyDto;
}
