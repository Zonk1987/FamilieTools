import { describe, expect, it } from 'vitest';

import { validateModuleId, validateModuleVersion } from '../src/validate-module-identity.js';

describe('validateModuleId', () => {
  it('accepts a valid reverse-domain style module ID', () => {
    expect(() => validateModuleId('org.familietools.calendar')).not.toThrow();
  });

  it('rejects an invalid module ID', () => {
    expect(() => validateModuleId('../../outside')).toThrow('Invalid module ID: "../../outside".');
  });
});

describe('validateModuleVersion', () => {
  it('accepts a valid semantic version', () => {
    expect(() => validateModuleVersion('1.2.3')).not.toThrow();
  });

  it('accepts a valid prerelease semantic version', () => {
    expect(() => validateModuleVersion('1.2.3-beta.1')).not.toThrow();
  });

  it('rejects a non-semantic version', () => {
    expect(() => validateModuleVersion('1.2')).toThrow('Invalid module version: "1.2".');
  });

  it('rejects an invalid prerelease version', () => {
    expect(() => validateModuleVersion('1.0.0-01')).toThrow('Invalid module version: "1.0.0-01".');
  });

  it('rejects path traversal as a version', () => {
    expect(() => validateModuleVersion('../1.0.0')).toThrow('Invalid module version: "../1.0.0".');
  });
});
