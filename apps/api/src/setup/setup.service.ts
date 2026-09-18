import { ConflictException, Injectable } from '@nestjs/common';

import { FamilyMembershipsService } from '../family-memberships/family-memberships.service.js';
import { FamiliesService } from '../families/families.service.js';
import { InstanceSettingsService } from '../instance-settings/instance-settings.service.js';
import { PlatformAuthService } from '../platform-auth/platform-auth.service.js';
import { PlatformStateService } from '../platform-state/platform-state.service.js';
import { UsersService } from '../users/users.service.js';
import type { InitializeSetupDto } from './dto/initialize-setup.dto.js';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class SetupService {
  constructor(
    private readonly platformStateService: PlatformStateService,
    private readonly instanceSettingsService: InstanceSettingsService,
    private readonly usersService: UsersService,
    private readonly familiesService: FamiliesService,
    private readonly familyMembershipsService: FamilyMembershipsService,
    private readonly databaseService: DatabaseService,
    private readonly platformAuthService: PlatformAuthService,
  ) {}

  async initialize(input: InitializeSetupDto) {
    return this.databaseService.transaction(async (tx) => {
      const setupAllowed = await this.platformStateService.isSetupAllowed(tx);

      if (!setupAllowed) {
        throw new ConflictException('Platform setup has already been completed');
      }

      await this.platformStateService.setState('initializing', tx);

      const user = await this.usersService.createUser(input.owner.displayName, tx);

      const family = await this.familiesService.createFamily(input.family.name, tx);

      await this.familyMembershipsService.addUserToFamily(family.id, user.id, tx);

      await this.platformAuthService.assignPlatformOwner(user.id, tx);

      await this.instanceSettingsService.set('instance.name', input.instance.name, tx);

      await this.instanceSettingsService.set(
        'instance.defaultLanguage',
        input.instance.defaultLanguage,
        tx,
      );

      await this.instanceSettingsService.set(
        'instance.defaultTimezone',
        input.instance.defaultTimezone,
        tx,
      );

      await this.platformStateService.setState('ready', tx);

      return {
        status: 'ready' as const,
        user,
        family,
      };
    });
  }
}
