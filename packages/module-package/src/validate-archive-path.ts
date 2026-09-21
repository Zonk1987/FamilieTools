import type { ArchivePathValidationResult } from './types.js';

export function validateArchivePath(path: string): ArchivePathValidationResult {
  if (path.length === 0) {
    return {
      valid: false,
      reason: 'Archive path must not be empty.',
    };
  }

  if (path.includes('\0')) {
    return {
      valid: false,
      reason: 'Archive path must not contain null bytes.',
    };
  }

  if (path.startsWith('/') || path.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(path)) {
    return {
      valid: false,
      reason: 'Archive path must be relative.',
    };
  }

  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(path)) {
    return {
      valid: false,
      reason: 'Archive path must not use a URI scheme.',
    };
  }

  const normalizedPath = path.replaceAll('\\', '/');
  const segments = normalizedPath.split('/');

  if (segments.some((segment) => segment === '..')) {
    return {
      valid: false,
      reason: 'Archive path must not contain parent-directory traversal.',
    };
  }

  if (segments.some((segment) => segment === '.')) {
    return {
      valid: false,
      reason: 'Archive path must not contain current-directory segments.',
    };
  }

  if (segments.some((segment) => segment.length === 0)) {
    return {
      valid: false,
      reason: 'Archive path must not contain empty path segments.',
    };
  }

  return {
    valid: true,
    normalizedPath,
  };
}
