import { IsBoolean } from 'class-validator';

export class SetModuleEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}
