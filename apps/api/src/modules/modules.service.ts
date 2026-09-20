import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { Module, NewModule } from '../database/schema/index.js';
import { ModulesRepository } from './modules.repository.js';

export type CreateModuleInput = {
  key: string;
  name: string;
  description?: string | null;
  isEnabled?: boolean;
  isSystem?: boolean;
  isRequired?: boolean;
  defaultEnabledForFamilies?: boolean;
};

@Injectable()
export class ModulesService {
  constructor(
    private readonly modulesRepository: ModulesRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async createModule(input: CreateModuleInput): Promise<Module> {
    const key = this.normalizeKey(input.key);
    const name = input.name.trim();

    if (!key) {
      throw new ConflictException('Module key must not be empty');
    }

    if (!name) {
      throw new ConflictException('Module name must not be empty');
    }

    return this.databaseService.transaction(async (tx) => {
      const existing = await this.modulesRepository.findByKey(key, tx);

      if (existing) {
        throw new ConflictException(`Module key "${key}" already exists`);
      }

      const isRequired = input.isRequired ?? false;

      const data: NewModule = {
        key,
        name,
        description: input.description?.trim() || null,
        isEnabled: isRequired ? true : (input.isEnabled ?? true),
        isSystem: input.isSystem ?? false,
        isRequired,
        defaultEnabledForFamilies: input.defaultEnabledForFamilies ?? true,
      };

      return this.modulesRepository.create(data, tx);
    });
  }

  async getModuleById(id: string): Promise<Module> {
    const module = await this.modulesRepository.findById(id);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return module;
  }

  async getModuleByKey(key: string): Promise<Module> {
    const normalizedKey = this.normalizeKey(key);

    const module = await this.modulesRepository.findByKey(normalizedKey);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return module;
  }

  async getModules(): Promise<Module[]> {
    return this.modulesRepository.findAll();
  }

  async getEnabledModules(): Promise<Module[]> {
    return this.modulesRepository.findEnabled();
  }

  async setModuleEnabled(id: string, enabled: boolean): Promise<Module> {
    return this.databaseService.transaction(async (tx) => {
      const module = await this.modulesRepository.findById(id, tx);

      if (!module) {
        throw new NotFoundException('Module not found');
      }

      if (!enabled && module.isRequired) {
        throw new ConflictException('Required modules cannot be disabled');
      }

      const updated = await this.modulesRepository.update(
        id,
        {
          isEnabled: enabled,
        },
        tx,
      );

      if (!updated) {
        throw new NotFoundException('Module not found');
      }

      return updated;
    });
  }

  async setDefaultEnabledForFamilies(id: string, enabled: boolean): Promise<Module> {
    return this.databaseService.transaction(async (tx) => {
      const module = await this.modulesRepository.findById(id, tx);

      if (!module) {
        throw new NotFoundException('Module not found');
      }

      const updated = await this.modulesRepository.update(
        id,
        {
          defaultEnabledForFamilies: enabled,
        },
        tx,
      );

      if (!updated) {
        throw new NotFoundException('Module not found');
      }

      return updated;
    });
  }

  async updateModule(
    id: string,
    input: Partial<Pick<CreateModuleInput, 'name' | 'description'>>,
  ): Promise<Module> {
    return this.databaseService.transaction(async (tx) => {
      const existing = await this.modulesRepository.findById(id, tx);

      if (!existing) {
        throw new NotFoundException('Module not found');
      }

      const update: Partial<NewModule> = {};

      if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
          throw new ConflictException('Module name must not be empty');
        }

        update.name = name;
      }

      if (input.description !== undefined) {
        update.description = input.description?.trim() || null;
      }

      const updated = await this.modulesRepository.update(id, update, tx);

      if (!updated) {
        throw new NotFoundException('Module not found');
      }

      return updated;
    });
  }

  async deleteModule(id: string): Promise<void> {
    return this.databaseService.transaction(async (tx) => {
      const module = await this.modulesRepository.findById(id, tx);

      if (!module) {
        throw new NotFoundException('Module not found');
      }

      if (module.isSystem) {
        throw new ConflictException('System modules cannot be deleted');
      }

      if (module.isRequired) {
        throw new ConflictException('Required modules cannot be deleted');
      }

      const deleted = await this.modulesRepository.delete(id, tx);

      if (!deleted) {
        throw new NotFoundException('Module not found');
      }
    });
  }

  private normalizeKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
