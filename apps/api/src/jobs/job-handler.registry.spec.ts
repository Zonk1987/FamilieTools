import { describe, expect, it } from 'vitest';

import { JobHandlerRegistry } from './job-handler.registry.js';
import type { JobHandler } from './job-handler.types.js';

describe('JobHandlerRegistry', () => {
  function createHandler(): JobHandler {
    return async () => ({
      ok: true,
    });
  }

  it('registers and resolves a handler', () => {
    const registry = new JobHandlerRegistry();

    const handler = createHandler();

    registry.register('core.test', handler);

    expect(registry.has('core.test')).toBe(true);

    expect(registry.get('core.test')).toBe(handler);
  });

  it('rejects duplicate handler registration', () => {
    const registry = new JobHandlerRegistry();

    registry.register('core.test', createHandler());

    expect(() => registry.register('core.test', createHandler())).toThrow(
      'Job handler "core.test" is already registered',
    );
  });

  it('throws for an unknown handler', () => {
    const registry = new JobHandlerRegistry();

    expect(() => registry.get('core.missing')).toThrow(
      'Job handler "core.missing" is not registered',
    );
  });

  it.each([
    '',
    ' core.test',
    'core.test ',
    'CORE.TEST',
    './handler',
    '../handler',
    'core/test',
    'core..test',
    'core test',
  ])('rejects invalid handler key "%s"', (key) => {
    const registry = new JobHandlerRegistry();

    expect(() => registry.register(key, createHandler())).toThrow();
  });

  it.each([
    'core.test',
    'core.auth.cleanup',
    'module.minecraft.backup',
    'server-health_check',
    'core.task-1',
  ])('accepts valid handler key "%s"', (key) => {
    const registry = new JobHandlerRegistry();

    expect(() => registry.register(key, createHandler())).not.toThrow();
  });

  it('returns registered keys in stable sorted order', () => {
    const registry = new JobHandlerRegistry();

    registry.register('core.zeta', createHandler());

    registry.register('core.alpha', createHandler());

    registry.register('module.test', createHandler());

    expect(registry.listKeys()).toEqual(['core.alpha', 'core.zeta', 'module.test']);
  });
});
