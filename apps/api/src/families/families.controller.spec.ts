import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { FamiliesController } from './families.controller.js';

function getMethod(methodName: keyof FamiliesController): Function {
  const descriptor = Object.getOwnPropertyDescriptor(FamiliesController.prototype, methodName);

  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(`Method "${String(methodName)}" not found on FamiliesController.`);
  }

  return descriptor.value;
}

describe('FamiliesController authorization', () => {
  it('requires families.manage for create', () => {
    const capability = Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, getMethod('create'));

    expect(capability).toBe('platform.families.manage');
  });

  it('requires families.read for findById', () => {
    const capability = Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, getMethod('findById'));

    expect(capability).toBe('platform.families.read');
  });
});
