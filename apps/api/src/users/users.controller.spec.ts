import { PLATFORM_CAPABILITY_METADATA_KEY } from '../platform-auth/require-platform-capability.decorator.js';
import { UsersController } from './users.controller.js';

function getMethod(methodName: keyof UsersController): Function {
  const descriptor = Object.getOwnPropertyDescriptor(UsersController.prototype, methodName);

  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(`Method "${String(methodName)}" not found on UsersController.`);
  }

  return descriptor.value;
}

describe('UsersController authorization', () => {
  it('requires users.manage for create', () => {
    const capability = Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, getMethod('create'));

    expect(capability).toBe('platform.users.manage');
  });

  it('requires users.read for findById', () => {
    const capability = Reflect.getMetadata(PLATFORM_CAPABILITY_METADATA_KEY, getMethod('findById'));

    expect(capability).toBe('platform.users.read');
  });
});
