import fs from 'node:fs/promises';
import path from 'node:path';

import type { ModulePackageInspection, ModulePackageInspectionOptions } from './types.js';
import { inspectModulePackageContents } from './inspect-package.js';
import { validateArchivePath } from './validate-archive-path.js';
import { verifyExtractedPackage } from './verify-extracted-package.js';

export interface ExtractModulePackageOptions {
  tempRoot: string;
  inspection?: ModulePackageInspectionOptions;
}

export interface ExtractedModulePackage {
  inspection: ModulePackageInspection;
  extractionPath: string;
}

export async function extractModulePackage(
  archive: Uint8Array,
  options: ExtractModulePackageOptions,
): Promise<ExtractedModulePackage> {
  const { inspection, files } = inspectModulePackageContents(archive, options.inspection);

  await fs.mkdir(options.tempRoot, {
    recursive: true,
  });

  const extractionPath = await fs.mkdtemp(path.join(options.tempRoot, 'familietools-module-'));

  try {
    for (const [rawPath, content] of Object.entries(files)) {
      const validation = validateArchivePath(rawPath);

      if (!validation.valid) {
        throw new Error(`Unsafe archive entry "${rawPath}": ${validation.reason}`);
      }

      const targetPath = path.resolve(extractionPath, validation.normalizedPath);

      const relativeTarget = path.relative(extractionPath, targetPath);

      if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
        throw new Error(`Archive entry escapes extraction root: "${rawPath}"`);
      }

      if (rawPath.endsWith('/')) {
        await fs.mkdir(targetPath, {
          recursive: true,
        });

        continue;
      }

      await fs.mkdir(path.dirname(targetPath), {
        recursive: true,
      });

      await fs.writeFile(targetPath, content);
    }

    await verifyExtractedPackage(extractionPath, inspection);

    return {
      inspection,
      extractionPath,
    };
  } catch (error) {
    await fs.rm(extractionPath, {
      recursive: true,
      force: true,
    });

    throw error;
  }
}
