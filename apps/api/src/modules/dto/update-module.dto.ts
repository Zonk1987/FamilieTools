import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
