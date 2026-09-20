import { describe, expect, it } from 'vitest';

import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { ThemesController } from './themes.controller.js';

function getCapability(methodName: keyof ThemesController) {
  const handler = ThemesController.prototype[methodName] as unknown as object;

  return Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, handler);
}

describe('ThemesController capability metadata', () => {
  it('requires read capability for read routes', () => {
    expect(getCapability('getThemes')).toBe('platform.themes.read');

    expect(getCapability('getEnabledThemes')).toBe('platform.themes.read');

    expect(getCapability('getDefaultTheme')).toBe('platform.themes.read');

    expect(getCapability('getThemeById')).toBe('platform.themes.read');
  });

  it('requires manage capability for write routes', () => {
    expect(getCapability('createTheme')).toBe('platform.themes.manage');

    expect(getCapability('updateTheme')).toBe('platform.themes.manage');

    expect(getCapability('setThemeEnabled')).toBe('platform.themes.manage');

    expect(getCapability('setDefaultTheme')).toBe('platform.themes.manage');

    expect(getCapability('deleteTheme')).toBe('platform.themes.manage');
  });
});
