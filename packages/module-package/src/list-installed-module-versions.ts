import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';

import { validateModuleId, validateModuleVersion } from './validate-module-identity.js';

export async function listInstalledModuleVersions(
  modulesRoot: string,
  moduleId: string,
): Promise<string[]> {
  validateModuleId(moduleId);

  const moduleRoot = path.join(modulesRoot, moduleId);

  let entries;

  try {
    entries = await fs.readdir(moduleRoot, {
      withFileTypes: true,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const versions = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => {
      validateModuleVersion(entry.name);

      return entry.name;
    });

  return versions.sort((a, b) => semver.compare(a, b));
}
