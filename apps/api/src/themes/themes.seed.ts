import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { themes, type ThemeTokens } from '../database/schema/index.js';

export const DEFAULT_SYSTEM_THEME_SLUG = 'familietools-light';

const defaultThemeTokens: ThemeTokens = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceMuted: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#e2e8f0',
    secondaryForeground: '#0f172a',
    accent: '#7c3aed',
    accentForeground: '#ffffff',
    border: '#cbd5e1',
    danger: '#dc2626',
    dangerForeground: '#ffffff',
    success: '#16a34a',
    successForeground: '#ffffff',
    warning: '#d97706',
    warningForeground: '#ffffff',
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  radius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  shadow: {
    small: '0 1px 2px rgb(15 23 42 / 0.06)',
    medium: '0 4px 12px rgb(15 23 42 / 0.10)',
    large: '0 12px 24px rgb(15 23 42 / 0.14)',
  },
};

@Injectable()
export class ThemesSeed implements OnApplicationBootstrap {
  constructor(private readonly databaseService: DatabaseService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    await this.databaseService.db
      .insert(themes)
      .values({
        name: 'FamilieTools Light',
        slug: DEFAULT_SYSTEM_THEME_SLUG,
        description: 'Built-in default theme for FamilieTools.',
        tokens: defaultThemeTokens,
        isEnabled: true,
        isDefault: true,
        isSystem: true,
      })
      .onConflictDoNothing({
        target: themes.slug,
      });
  }
}
