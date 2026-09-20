import { IsBoolean } from 'class-validator';

export class SetModuleDefaultDto {
  @IsBoolean()
  enabled!: boolean;
}
