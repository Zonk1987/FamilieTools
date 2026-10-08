import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { NewWorkspace, Workspace } from '../database/schema/index.js';
import { WorkspacesRepository } from './workspaces.repository.js';

function isPostgresUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug);

    if (!name) {
      throw new ConflictException('Workspace name must not be empty');
    }

    if (!slug) {
      throw new ConflictException('Workspace slug must not be empty');
    }

    return this.databaseService.transaction(async (tx) => {
      const existing = await this.workspacesRepository.findBySlug(slug, tx);

      if (existing) {
        throw new ConflictException(`Workspace slug "${slug}" already exists`);
      }

      const data: NewWorkspace = {
        name,
        slug,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      };

      try {
        return await this.workspacesRepository.create(data, tx);
      } catch (error) {
        if (isPostgresUniqueViolation(error)) {
          throw new ConflictException(`Workspace slug "${slug}" already exists`);
        }

        throw error;
      }
    });
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findById(id);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace> {
    const normalizedSlug = this.normalizeSlug(slug);

    const workspace = await this.workspacesRepository.findBySlug(normalizedSlug);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.workspacesRepository.findAll();
  }

  async updateWorkspace(
    id: string,
    input: Partial<Pick<CreateWorkspaceInput, 'name' | 'slug' | 'description' | 'isActive'>>,
  ): Promise<Workspace> {
    return this.databaseService.transaction(async (tx) => {
      const existing = await this.workspacesRepository.findById(id, tx);

      if (!existing) {
        throw new NotFoundException('Workspace not found');
      }

      const update: Partial<NewWorkspace> = {};

      if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
          throw new ConflictException('Workspace name must not be empty');
        }

        update.name = name;
      }

      if (input.slug !== undefined) {
        const slug = this.normalizeSlug(input.slug);

        if (!slug) {
          throw new ConflictException('Workspace slug must not be empty');
        }

        const workspaceWithSlug = await this.workspacesRepository.findBySlug(slug, tx);

        if (workspaceWithSlug && workspaceWithSlug.id !== id) {
          throw new ConflictException(`Workspace slug "${slug}" already exists`);
        }

        update.slug = slug;
      }

      if (input.description !== undefined) {
        update.description = input.description?.trim() || null;
      }

      if (input.isActive !== undefined) {
        update.isActive = input.isActive;
      }

      let workspace: Workspace | null;

      try {
        workspace = await this.workspacesRepository.update(id, update, tx);
      } catch (error) {
        if (input.slug !== undefined && isPostgresUniqueViolation(error)) {
          throw new ConflictException(`Workspace slug "${update.slug}" already exists`);
        }

        throw error;
      }

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      return workspace;
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return this.databaseService.transaction(async (tx) => {
      const existing = await this.workspacesRepository.findById(id, tx);

      if (!existing) {
        throw new NotFoundException('Workspace not found');
      }

      const deleted = await this.workspacesRepository.delete(id, tx);

      if (!deleted) {
        throw new NotFoundException('Workspace not found');
      }
    });
  }

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
