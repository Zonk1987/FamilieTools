import { describe, expect, it } from 'vitest';

import { validateArchivePath } from '../src/validate-archive-path.js';

describe('validateArchivePath', () => {
  it('accepts safe relative archive paths', () => {
    expect(validateArchivePath('dist/backend/index.js')).toEqual({
      valid: true,
      normalizedPath: 'dist/backend/index.js',
    });
  });

  it.each([
    '../evil.js',
    '..\\evil.js',
    '/etc/passwd',
    '\\windows\\system32',
    'C:\\Windows\\System32\\evil.js',
    'file:///etc/passwd',
    'https://example.com/evil.js',
    './dist/index.js',
    'dist//index.js',
  ])('rejects unsafe path %s', (path) => {
    expect(validateArchivePath(path).valid).toBe(false);
  });
});
