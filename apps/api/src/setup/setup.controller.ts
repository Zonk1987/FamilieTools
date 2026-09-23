import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { InitializeSetupDto } from './dto/initialize-setup.dto.js';
import { SetupService } from './setup.service.js';
import { PlatformStateService } from '../platform-state/platform-state.service.js';

class SetupStatusResponseDto {
  state!: 'uninitialized' | 'initializing' | 'ready' | 'maintenance';
  setupAllowed!: boolean;
}

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly platformStateService: PlatformStateService,
    private readonly setupService: SetupService,
  ) {}

  @Post('initialize')
  @ApiCreatedResponse()
  async initializeSetup(@Body() input: InitializeSetupDto): Promise<void> {
    await this.setupService.initialize(input);
  }

  @Get('status')
  @ApiOkResponse({
    type: SetupStatusResponseDto,
  })
  async getStatus(): Promise<SetupStatusResponseDto> {
    const state = await this.platformStateService.getState();

    return {
      state,
      setupAllowed: state === 'uninitialized',
    };
  }
}
