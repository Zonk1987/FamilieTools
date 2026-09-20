import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { Theme } from '../database/schema/index.js';
import { ThemesRepository } from '../themes/themes.repository.js';
import { UsersService } from '../users/users.service.js';
import { UserPreferencesRepository } from './user-preferences.repository.js';

export type UpdateUserPreferencesInput = {
  themeId?: string | null;
  colorScheme?: 'system' | 'light' | 'dark';
  density?: 'comfortable' | 'compact';
  reducedMotion?: boolean;
};

export type ResolvedUserPreferences = {
  userId: string;
  theme: Theme;
  colorScheme: 'system' | 'light' | 'dark';
  density: 'comfortable' | 'compact';
  reducedMotion: boolean;
};

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly themesRepository: ThemesRepository,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getResolvedPreferences(userId: string): Promise<ResolvedUserPreferences> {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const preference = await this.userPreferencesRepository.findByUserId(userId);

    const theme = await this.resolveTheme(preference?.themeId ?? null);

    return {
      userId,
      theme,
      colorScheme: preference?.colorScheme ?? 'system',
      density: preference?.density ?? 'comfortable',
      reducedMotion: preference?.reducedMotion ?? false,
    };
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<ResolvedUserPreferences> {
    return this.databaseService.transaction(async (tx) => {
      const user = await this.usersService.findUserById(userId, tx);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existing = await this.userPreferencesRepository.findByUserId(userId, tx);

      let themeId = input.themeId !== undefined ? input.themeId : (existing?.themeId ?? null);

      if (themeId !== null) {
        const selectedTheme = await this.themesRepository.findById(themeId, tx);

        if (!selectedTheme) {
          throw new NotFoundException('Theme not found');
        }

        if (!selectedTheme.isEnabled) {
          throw new ConflictException('Disabled themes cannot be selected');
        }
      }

      const preference = await this.userPreferencesRepository.upsert(
        {
          userId,
          themeId,
          colorScheme: input.colorScheme ?? existing?.colorScheme ?? 'system',
          density: input.density ?? existing?.density ?? 'comfortable',
          reducedMotion: input.reducedMotion ?? existing?.reducedMotion ?? false,
        },
        tx,
      );

      const theme = await this.resolveTheme(preference.themeId, tx);

      return {
        userId,
        theme,
        colorScheme: preference.colorScheme,
        density: preference.density,
        reducedMotion: preference.reducedMotion,
      };
    });
  }

  private async resolveTheme(
    selectedThemeId: string | null,
    database = this.databaseService.db,
  ): Promise<Theme> {
    if (selectedThemeId) {
      const selectedTheme = await this.themesRepository.findById(selectedThemeId, database);

      if (selectedTheme && selectedTheme.isEnabled) {
        return selectedTheme;
      }
    }

    const defaultTheme = await this.themesRepository.findDefault(database);

    if (!defaultTheme) {
      throw new NotFoundException('Default theme is not configured');
    }

    return defaultTheme;
  }
}
