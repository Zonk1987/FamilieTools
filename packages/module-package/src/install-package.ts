import fs from 'node:fs/promises';
import path from 'node:path';

import { extractModulePackage } from './extract-package.js';
import type { ModulePackageInspectionOptions } from './types.js';

export interface InstallModulePackageOptions {
  modulesRoot: string;
  tempRoot: string;
  inspection?: ModulePackageInspectionOptions;
}

export interface InstalledModulePackage {
  moduleId: string;
  version: string;
  installationPath: string;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

export async function installModulePackage(
  archive: Uint8Array,
  options: InstallModulePackageOptions,
): Promise<InstalledModulePackage> {
  await fs.mkdir(options.modulesRoot, {
    recursive: true,
  });

  const extracted = await extractModulePackage(archive, {
    tempRoot: options.tempRoot,
    inspection: options.inspection,
  });

  const moduleId = extracted.inspection.manifest.id;
  const version = extracted.inspection.manifest.version;

  const moduleRoot = path.join(options.modulesRoot, moduleId);

  const installationPath = path.join(moduleRoot, version);

  const lockPath = path.join(moduleRoot, `.${version}.installing`);

  let lockAcquired = false;
  let installationCompleted = false;

  try {
    await fs.mkdir(moduleRoot, {
      recursive: true,
    });

    /*
     * mkdir without recursive is atomic.
     * Only one concurrent installer can create this lock directory.
     */
    try {
      await fs.mkdir(lockPath);
      lockAcquired = true;
    } catch (error) {
      if (isNodeError(error) && error.code === 'EEXIST') {
        throw new Error(`Module "${moduleId}" version "${version}" is already installed.`);
      }

      throw error;
    }

    /*
     * Once we own the lock, no competing installer for the same
     * module/version can reach this section.
     */
    if (await pathExists(installationPath)) {
      throw new Error(`Module "${moduleId}" version "${version}" is already installed.`);
    }

    await fs.rename(extracted.extractionPath, installationPath);

    installationCompleted = true;

    return {
      moduleId,
      version,
      installationPath,
    };
  } finally {
    /*
     * If the installation failed before the atomic move,
     * remove the temporary extraction directory.
     */
    if (!installationCompleted) {
      await fs.rm(extracted.extractionPath, {
        recursive: true,
        force: true,
      });
    }

    /*
     * Always release our installation lock.
     */
    if (lockAcquired) {
      await fs.rm(lockPath, {
        recursive: true,
        force: true,
      });
    }
  }
}
