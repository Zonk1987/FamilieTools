import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { strToU8, zipSync } from 'fflate';
import { afterEach, describe, expect, it } from 'vitest';

import { installModulePackage } from '../src/install-package.js';

const cleanupPaths: string[] = [];

function createValidManifest(id = 'org.familietools.test', version = '1.0.0') {
  return {
    manifestVersion: 1,
    id,
    name: 'Test Module',
    version,
    publisher: {
      id: 'familietools',
      name: 'FamilieTools',
    },
    compatibility: {
      platform: '>=1.0.0',
      moduleApi: '^1.0.0',
    },
    entrypoints: {
      backend: 'dist/backend/index.js',
    },
  };
}

function createArchive(files: Record<string, string>): Uint8Array {
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([filePath, content]) => [filePath, strToU8(content)]),
    ),
  );
}

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map((directory) =>
      fs.rm(directory, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('installModulePackage', () => {
  it('installs a valid module package into the final module directory', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');

    const tempRoot = path.join(root, 'temp');

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/backend/index.js': 'export default {};',
    });

    const result = await installModulePackage(archive, {
      modulesRoot,
      tempRoot,
    });

    expect(result.moduleId).toBe('org.familietools.test');

    expect(result.version).toBe('1.0.0');

    const backend = await fs.readFile(
      path.join(result.installationPath, 'dist', 'backend', 'index.js'),
      'utf8',
    );

    expect(backend).toBe('export default {};');
  });

  it('rejects installation when the same module version already exists', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');

    const tempRoot = path.join(root, 'temp');

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/backend/index.js': 'export default {};',
    });

    await installModulePackage(archive, {
      modulesRoot,
      tempRoot,
    });

    await expect(
      installModulePackage(archive, {
        modulesRoot,
        tempRoot,
      }),
    ).rejects.toThrow('Module "org.familietools.test" version "1.0.0" is already installed.');
  });

  it('keeps different module versions separated', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');

    const tempRoot = path.join(root, 'temp');

    const firstArchive = createArchive({
      'module.json': JSON.stringify(createValidManifest('org.familietools.test', '1.0.0')),
      'dist/backend/index.js': 'v1',
    });

    const secondArchive = createArchive({
      'module.json': JSON.stringify(createValidManifest('org.familietools.test', '2.0.0')),
      'dist/backend/index.js': 'v2',
    });

    const first = await installModulePackage(firstArchive, {
      modulesRoot,
      tempRoot,
    });

    const second = await installModulePackage(secondArchive, {
      modulesRoot,
      tempRoot,
    });

    expect(first.installationPath).not.toBe(second.installationPath);

    expect(
      await fs.readFile(path.join(first.installationPath, 'dist', 'backend', 'index.js'), 'utf8'),
    ).toBe('v1');

    expect(
      await fs.readFile(path.join(second.installationPath, 'dist', 'backend', 'index.js'), 'utf8'),
    ).toBe('v2');
  });

  it('passes inspection limits through the installer', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const tempRoot = path.join(root, 'temp');

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
    });

    await expect(
      installModulePackage(archive, {
        modulesRoot,
        tempRoot,
        inspection: {
          maxArchiveSize: 1,
        },
      }),
    ).rejects.toThrow('Module package exceeds maximum archive size.');
  });
  it('cleans up temporary extraction data when installation fails', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const tempRoot = path.join(root, 'temp');

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/backend/index.js': 'export default {};',
    });

    await installModulePackage(archive, {
      modulesRoot,
      tempRoot,
    });

    await expect(
      installModulePackage(archive, {
        modulesRoot,
        tempRoot,
      }),
    ).rejects.toThrow('Module "org.familietools.test" version "1.0.0" is already installed.');

    const tempEntries = await fs.readdir(tempRoot);

    expect(tempEntries).toHaveLength(0);
  });
  it('allows only one concurrent installation of the same module version', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-install-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const tempRoot = path.join(root, 'temp');

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/backend/index.js': 'export default {};',
    });

    const results = await Promise.allSettled([
      installModulePackage(archive, {
        modulesRoot,
        tempRoot,
      }),
      installModulePackage(archive, {
        modulesRoot,
        tempRoot,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');

    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    if (rejected[0]?.status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(Error);
      expect(rejected[0].reason.message).toBe(
        'Module "org.familietools.test" version "1.0.0" is already installed.',
      );
    }
  });
});
