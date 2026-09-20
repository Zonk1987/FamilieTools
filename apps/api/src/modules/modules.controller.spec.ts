import { describe, expect, it } from 'vitest';

import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { ModulesController } from './modules.controller.js';

function getCapability(methodName: keyof ModulesController) {
  const handler = ModulesController.prototype[methodName] as unknown as object;

  return Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, handler);
}

describe('ModulesController capability metadata', () => {
  it('requires read capability for read routes', () => {
    expect(getCapability('getModules')).toBe('platform.modules.read');

    expect(getCapability('getEnabledModules')).toBe('platform.modules.read');

    expect(getCapability('getModuleById')).toBe('platform.modules.read');
  });

  it('requires manage capability for write routes', () => {
    expect(getCapability('createModule')).toBe('platform.modules.manage');

    expect(getCapability('updateModule')).toBe('platform.modules.manage');

    expect(getCapability('setModuleEnabled')).toBe('platform.modules.manage');

    expect(getCapability('setModuleDefault')).toBe('platform.modules.manage');

    expect(getCapability('deleteModule')).toBe('platform.modules.manage');
  });
});
