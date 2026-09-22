import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { Module, NewModule } from '../database/schema/index.js';
import { ModulesRepository } from './modules.repository.js';

export type CreateModuleInput = {
  moduleId: string;
  version: string;
  name: string;
  description?: string | null;
  publisher: string;
  installationPath: string;
  packageSha256: string;
  installSource?: string;
  manifest: Record<string, unknown>;
  isEnabled?: boolean;
};

@Injectable()
export class ModulesService {
  constructor(
    private readonly modulesRepository: ModulesRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async createModule(input: CreateModuleInput): Promise<Module> {
    const moduleId = input.moduleId.trim();
    const version = input.version.trim();
    const name = input.name.trim();
    const publisher = input.publisher.trim();
    const installationPath = input.installationPath.trim();
    const packageSha256 = input.packageSha256.trim();
    const installSource = input.installSource?.trim() || 'local';

    if (!moduleId) {
      throw new ConflictException('Module ID must not be empty');
    }

    if (!version) {
      throw new ConflictException('Module version must not be empty');
    }

    if (!name) {
      throw new ConflictException('Module name must not be empty');
    }

    if (!publisher) {
      throw new ConflictException('Module publisher must not be empty');
    }

    if (!installationPath) {
      throw new ConflictException('Module installation path must not be empty');
    }

    if (!packageSha256) {
      throw new ConflictException('Module package SHA-256 must not be empty');
    }

    return this.databaseService.transaction(async (tx) => {
      const existing = await this.modulesRepository.findByModuleIdAndVersion(moduleId, version, tx);

      if (existing) {
        throw new ConflictException(
          `Module "${moduleId}" version "${version}" is already installed`,
        );
      }

      const data: NewModule = {
        moduleId,
        version,
        name,
        description: input.description?.trim() || null,
        publisher,
        installationPath,
        packageSha256,
        installSource,
        manifest: input.manifest,
        isEnabled: input.isEnabled ?? true,
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

  async getModuleVersions(moduleId: string): Promise<Module[]> {
    return this.modulesRepository.findByModuleId(moduleId);
  }

  async getModuleByVersion(moduleId: string, version: string): Promise<Module> {
    const module = await this.modulesRepository.findByModuleIdAndVersion(moduleId, version);

    if (!module) {
      throw new NotFoundException('Module version not found');
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

      const deleted = await this.modulesRepository.delete(id, tx);

      if (!deleted) {
        throw new NotFoundException('Module not found');
      }
    });
  }
}
