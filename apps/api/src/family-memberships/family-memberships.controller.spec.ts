import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { FamilyMembershipsController } from './family-memberships.controller.js';

function getMethod(methodName: keyof FamilyMembershipsController): Function {
  const descriptor = Object.getOwnPropertyDescriptor(
    FamilyMembershipsController.prototype,
    methodName,
  );

  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(`Method "${String(methodName)}" not found on FamilyMembershipsController.`);
  }

  return descriptor.value;
}

describe('FamilyMembershipsController authorization', () => {
  it('requires families.manage for membership changes', () => {
    const capability = Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, getMethod('create'));

    expect(capability).toBe('platform.families.manage');
  });
});
