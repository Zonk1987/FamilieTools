import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateWorkspaceMembershipDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  workspaceId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;
}
