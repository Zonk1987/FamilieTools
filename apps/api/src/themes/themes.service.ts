import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { NewTheme, Theme, ThemeTokens } from '../database/schema/index.js';
import { ThemesRepository } from './themes.repository.js';

export type CreateThemeInput = {
  name: string;
  slug: string;
  description?: string | null;
  tokens: ThemeTokens;
  isEnabled?: boolean;
  isDefault?: boolean;
  isSystem?: boolean;
};

@Injectable()
export class ThemesService {
  constructor(
    private readonly themesRepository: ThemesRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async createTheme(input: CreateThemeInput): Promise<Theme> {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug);

    if (!name) {
      throw new ConflictException('Theme name must not be empty');
    }

    if (!slug) {
      throw new ConflictException('Theme slug must not be empty');
    }

    return this.databaseService.transaction(async (tx) => {
      const existing = await this.themesRepository.findBySlug(slug, tx);

      if (existing) {
        throw new ConflictException(`Theme slug "${slug}" already exists`);
      }

      const currentDefault = await this.themesRepository.findDefault(tx);

      /*
       * The first theme automatically becomes the default.
       * Afterwards a default can only be changed explicitly.
       */
      const shouldBecomeDefault = input.isDefault === true || currentDefault === null;

      if (shouldBecomeDefault && currentDefault) {
        await this.themesRepository.clearDefault(tx);
      }

      const data: NewTheme = {
        name,
        slug,
        description: input.description?.trim() || null,
        tokens: input.tokens,
        isEnabled: shouldBecomeDefault ? true : (input.isEnabled ?? true),
        isDefault: shouldBecomeDefault,
        isSystem: input.isSystem ?? false,
      };

      return this.themesRepository.create(data, tx);
    });
  }

  async getThemeById(id: string): Promise<Theme> {
    const theme = await this.themesRepository.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return theme;
  }

  async getThemeBySlug(slug: string): Promise<Theme> {
    const normalizedSlug = this.normalizeSlug(slug);

    const theme = await this.themesRepository.findBySlug(normalizedSlug);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return theme;
  }

  async getThemes(): Promise<Theme[]> {
    return this.themesRepository.findAll();
  }

  async getEnabledThemes(): Promise<Theme[]> {
    return this.themesRepository.findEnabled();
  }

  async getDefaultTheme(): Promise<Theme> {
    const theme = await this.themesRepository.findDefault();

    if (!theme) {
      throw new NotFoundException('Default theme is not configured');
    }

    return theme;
  }

  async setDefaultTheme(id: string): Promise<Theme> {
    return this.databaseService.transaction(async (tx) => {
      const theme = await this.themesRepository.findById(id, tx);

      if (!theme) {
        throw new NotFoundException('Theme not found');
      }

      await this.themesRepository.clearDefault(tx);

      const updated = await this.themesRepository.update(
        id,
        {
          isDefault: true,
          isEnabled: true,
        },
        tx,
      );

      if (!updated) {
        throw new NotFoundException('Theme not found');
      }

      return updated;
    });
  }

  async setThemeEnabled(id: string, enabled: boolean): Promise<Theme> {
    return this.databaseService.transaction(async (tx) => {
      const theme = await this.themesRepository.findById(id, tx);

      if (!theme) {
        throw new NotFoundException('Theme not found');
      }

      if (!enabled && theme.isDefault) {
        throw new ConflictException('The default theme cannot be disabled');
      }

      const updated = await this.themesRepository.update(
        id,
        {
          isEnabled: enabled,
        },
        tx,
      );

      if (!updated) {
        throw new NotFoundException('Theme not found');
      }

      return updated;
    });
  }

  async updateTheme(
    id: string,
    input: Partial<Pick<CreateThemeInput, 'name' | 'slug' | 'description' | 'tokens'>>,
  ): Promise<Theme> {
    return this.databaseService.transaction(async (tx) => {
      const existing = await this.themesRepository.findById(id, tx);

      if (!existing) {
        throw new NotFoundException('Theme not found');
      }

      const update: Partial<NewTheme> = {};

      if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
          throw new ConflictException('Theme name must not be empty');
        }

        update.name = name;
      }

      if (input.slug !== undefined) {
        const slug = this.normalizeSlug(input.slug);

        if (!slug) {
          throw new ConflictException('Theme slug must not be empty');
        }

        const themeWithSlug = await this.themesRepository.findBySlug(slug, tx);

        if (themeWithSlug && themeWithSlug.id !== id) {
          throw new ConflictException(`Theme slug "${slug}" already exists`);
        }

        update.slug = slug;
      }

      if (input.description !== undefined) {
        update.description = input.description?.trim() || null;
      }

      if (input.tokens !== undefined) {
        update.tokens = input.tokens;
      }

      const updated = await this.themesRepository.update(id, update, tx);

      if (!updated) {
        throw new NotFoundException('Theme not found');
      }

      return updated;
    });
  }

  async deleteTheme(id: string): Promise<void> {
    return this.databaseService.transaction(async (tx) => {
      const theme = await this.themesRepository.findById(id, tx);

      if (!theme) {
        throw new NotFoundException('Theme not found');
      }

      if (theme.isSystem) {
        throw new ConflictException('System themes cannot be deleted');
      }

      if (theme.isDefault) {
        throw new ConflictException('The default theme cannot be deleted');
      }

      const deleted = await this.themesRepository.delete(id, tx);

      if (!deleted) {
        throw new NotFoundException('Theme not found');
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
