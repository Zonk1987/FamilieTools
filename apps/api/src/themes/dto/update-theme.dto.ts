import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import type { ThemeTokens } from '../../database/schema/index.js';

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsObject()
  tokens?: ThemeTokens;
}
