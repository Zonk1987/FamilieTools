import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { ModulesService } from './modules.service.js';

const BUILT_IN_MODULES = [
  {
    key: 'calendar',
    name: 'Calendar',
    description: 'Shared family calendar and scheduling.',
    isEnabled: true,
    isSystem: true,
    isRequired: false,
    defaultEnabledForFamilies: true,
  },
  {
    key: 'shopping',
    name: 'Shopping',
    description: 'Shared shopping lists for families.',
    isEnabled: true,
    isSystem: true,
    isRequired: false,
    defaultEnabledForFamilies: true,
  },
  {
    key: 'baby_tracking',
    name: 'Baby Tracking',
    description: 'Baby feeding, sleep and care tracking.',
    isEnabled: true,
    isSystem: true,
    isRequired: false,
    defaultEnabledForFamilies: false,
  },
  {
    key: 'photos',
    name: 'Photos',
    description: 'Private family photo and media management.',
    isEnabled: true,
    isSystem: true,
    isRequired: false,
    defaultEnabledForFamilies: false,
  },
] as const;

@Injectable()
export class ModulesSeed implements OnApplicationBootstrap {
  constructor(private readonly modulesService: ModulesService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    for (const module of BUILT_IN_MODULES) {
      try {
        await this.modulesService.getModuleByKey(module.key);
      } catch {
        await this.modulesService.createModule(module);
      }
    }
  }
}
