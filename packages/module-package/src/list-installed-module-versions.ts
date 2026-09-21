import fs from 'node:fs/promises';
import path from 'node:path';
import { validateModuleId } from './validate-module-identity.js';

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

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}
