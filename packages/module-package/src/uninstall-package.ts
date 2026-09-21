import fs from 'node:fs/promises';
import path from 'node:path';
import { validateModuleId, validateModuleVersion } from './validate-module-identity.js';

export interface UninstallModulePackageOptions {
  modulesRoot: string;
  moduleId: string;
  version: string;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export async function uninstallModulePackage(
  options: UninstallModulePackageOptions,
): Promise<void> {
  validateModuleId(options.moduleId);
  validateModuleVersion(options.version);

  const moduleRoot = path.join(options.modulesRoot, options.moduleId);

  const installationPath = path.join(moduleRoot, options.version);

  const lockPath = path.join(moduleRoot, `.${options.version}.installing`);

  try {
    await fs.access(lockPath);

    throw new Error(
      `Module "${options.moduleId}" version "${options.version}" is currently being installed.`,
    );
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      // No active install lock.
    } else {
      throw error;
    }
  }

  try {
    await fs.access(installationPath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new Error(
        `Module "${options.moduleId}" version "${options.version}" is not installed.`,
      );
    }

    throw error;
  }

  await fs.rm(installationPath, {
    recursive: true,
    force: false,
  });

  const remainingEntries = await fs.readdir(moduleRoot);

  if (remainingEntries.length === 0) {
    await fs.rm(moduleRoot, {
      recursive: true,
      force: true,
    });
  }
}
