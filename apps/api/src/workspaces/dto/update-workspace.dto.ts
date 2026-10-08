import { PartialType } from '@nestjs/swagger';

import { CreateWorkspaceDto } from './create-workspace.dto.js';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {}
