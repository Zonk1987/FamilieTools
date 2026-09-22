import { validateModuleManifest, type ModuleManifest } from '@familietools/module-schema';
import { strFromU8, unzipSync } from 'fflate';
import { createHash } from 'node:crypto';

import type {
  ModulePackageEntry,
  ModulePackageInspection,
  ModulePackageInspectionOptions,
} from './types.js';
import { validateArchivePath } from './validate-archive-path.js';

export const MAX_ARCHIVE_SIZE = 128 * 1024 * 1024;
export const MAX_FILE_COUNT = 10_000;
export const MAX_TOTAL_UNCOMPRESSED_SIZE = 512 * 1024 * 1024;

interface InspectedModulePackageContents {
  inspection: ModulePackageInspection;
  files: Record<string, Uint8Array>;
}

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export function inspectModulePackageContents(
  archive: Uint8Array,
  options: ModulePackageInspectionOptions = {},
): InspectedModulePackageContents {
  const maxArchiveSize = options.maxArchiveSize ?? MAX_ARCHIVE_SIZE;
  const maxFileCount = options.maxFileCount ?? MAX_FILE_COUNT;
  const maxTotalUncompressedSize = options.maxTotalUncompressedSize ?? MAX_TOTAL_UNCOMPRESSED_SIZE;

  if (archive.byteLength > maxArchiveSize) {
    throw new Error('Module package exceeds maximum archive size.');
  }

  const packageSha256 = sha256(archive);

  let declaredFileCount = 0;
  let declaredUncompressedSize = 0;

  const seenArchivePaths = new Set<string>();

  function registerArchivePath(rawPath: string, normalizedPath: string): void {
    const collisionKey = normalizedPath.toLowerCase();

    if (seenArchivePaths.has(collisionKey)) {
      throw new Error(`Module package contains colliding archive path: "${rawPath}".`);
    }

    const segments = collisionKey.split('/');

    for (let index = 1; index < segments.length; index += 1) {
      const parentPath = segments.slice(0, index).join('/');

      if (seenArchivePaths.has(parentPath)) {
        throw new Error(`Module package contains file/directory path conflict: "${rawPath}".`);
      }
    }

    for (const existingPath of seenArchivePaths) {
      if (existingPath.startsWith(`${collisionKey}/`)) {
        throw new Error(`Module package contains file/directory path conflict: "${rawPath}".`);
      }
    }

    seenArchivePaths.add(collisionKey);
  }

  const files = unzipSync(archive, {
    filter(file) {
      declaredFileCount += 1;

      if (declaredFileCount > maxFileCount) {
        throw new Error('Module package exceeds maximum file count.');
      }

      const pathValidation = validateArchivePath(file.name);

      if (!pathValidation.valid) {
        throw new Error(`Unsafe archive entry "${file.name}": ${pathValidation.reason}`);
      }

      registerArchivePath(file.name, pathValidation.normalizedPath);

      declaredUncompressedSize += file.originalSize;

      if (declaredUncompressedSize > maxTotalUncompressedSize) {
        throw new Error('Module package exceeds maximum declared uncompressed size.');
      }

      return true;
    },
  });

  const entries: ModulePackageEntry[] = [];

  let totalUncompressedSize = 0;

  for (const [rawPath, content] of Object.entries(files)) {
    const validation = validateArchivePath(rawPath);

    if (!validation.valid) {
      throw new Error(`Unsafe archive entry "${rawPath}": ${validation.reason}`);
    }

    const size = content.byteLength;

    totalUncompressedSize += size;

    if (totalUncompressedSize > maxTotalUncompressedSize) {
      throw new Error('Module package exceeds maximum uncompressed size.');
    }

    entries.push({
      path: validation.normalizedPath,
      size,
      isDirectory: rawPath.endsWith('/'),
      sha256: sha256(content),
    });

    if (entries.length > maxFileCount) {
      throw new Error('Module package exceeds maximum file count.');
    }
  }

  const manifestEntry = files['module.json'];

  if (!manifestEntry) {
    throw new Error('Module package must contain module.json in archive root.');
  }

  let manifest: unknown;

  try {
    manifest = JSON.parse(strFromU8(manifestEntry));
  } catch {
    throw new Error('module.json contains invalid JSON.');
  }

  const manifestValidation = validateModuleManifest(manifest);

  if (!manifestValidation.valid) {
    const details = manifestValidation.errors
      .map((error) => {
        const location = error.instancePath || '/';

        const message = error.message ?? 'validation error';

        return `${location} ${message}`;
      })
      .join('; ');

    throw new Error(`Invalid module manifest: ${details}`);
  }

  const inspection: ModulePackageInspection = {
    entries,
    fileCount: entries.length,
    totalUncompressedSize,
    hasManifest: true,
    manifest: manifest as ModuleManifest,
    packageSha256,
  };

  return {
    inspection,
    files,
  };
}

export function inspectModulePackage(
  archive: Uint8Array,
  options: ModulePackageInspectionOptions = {},
): ModulePackageInspection {
  return inspectModulePackageContents(archive, options).inspection;
}
