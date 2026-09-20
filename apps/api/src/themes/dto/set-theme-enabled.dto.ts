import { IsBoolean } from 'class-validator';

export class SetThemeEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}
