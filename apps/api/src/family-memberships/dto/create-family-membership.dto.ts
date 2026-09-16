import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateFamilyMembershipDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  familyId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;
}
