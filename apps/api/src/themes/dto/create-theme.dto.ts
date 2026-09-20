import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import type { ThemeTokens } from '../../database/schema/index.js';

export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsObject()
  tokens!: ThemeTokens;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
