import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { listInstalledModuleVersions } from '../src/list-installed-module-versions.js';
import { uninstallModulePackage } from '../src/uninstall-package.js';

const cleanupPaths: string[] = [];

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

describe('module package uninstall', () => {
  it('lists installed module versions', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const moduleRoot = path.join(modulesRoot, 'org.familietools.test');

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '2.0.0'), {
      recursive: true,
    });

    const versions = await listInstalledModuleVersions(modulesRoot, 'org.familietools.test');

    expect(versions).toEqual(['1.0.0', '2.0.0']);
  });

  it('returns an empty version list for an unknown module', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    const versions = await listInstalledModuleVersions(
      path.join(root, 'modules'),
      'org.familietools.unknown',
    );

    expect(versions).toEqual([]);
  });

  it('removes one installed module version', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const moduleRoot = path.join(modulesRoot, 'org.familietools.test');

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '2.0.0'), {
      recursive: true,
    });

    await uninstallModulePackage({
      modulesRoot,
      moduleId: 'org.familietools.test',
      version: '1.0.0',
    });

    const versions = await listInstalledModuleVersions(modulesRoot, 'org.familietools.test');

    expect(versions).toEqual(['2.0.0']);
  });

  it('removes the module directory when the final version is uninstalled', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const moduleRoot = path.join(modulesRoot, 'org.familietools.test');

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await uninstallModulePackage({
      modulesRoot,
      moduleId: 'org.familietools.test',
      version: '1.0.0',
    });

    await expect(fs.access(moduleRoot)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('rejects uninstalling a missing module version', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    await expect(
      uninstallModulePackage({
        modulesRoot: path.join(root, 'modules'),
        moduleId: 'org.familietools.test',
        version: '1.0.0',
      }),
    ).rejects.toThrow('Module "org.familietools.test" version "1.0.0" is not installed.');
  });

  it('rejects uninstall while the same version is being installed', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-uninstall-test-'));

    cleanupPaths.push(root);

    const modulesRoot = path.join(root, 'modules');
    const moduleRoot = path.join(modulesRoot, 'org.familietools.test');

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '.1.0.0.installing'));

    await expect(
      uninstallModulePackage({
        modulesRoot,
        moduleId: 'org.familietools.test',
        version: '1.0.0',
      }),
    ).rejects.toThrow(
      'Module "org.familietools.test" version "1.0.0" is currently being installed.',
    );
  });
  it('rejects an invalid module ID when listing versions', async () => {
    await expect(listInstalledModuleVersions('modules', '../../outside')).rejects.toThrow(
      'Invalid module ID: "../../outside".',
    );
  });

  it('rejects an invalid module ID when uninstalling', async () => {
    await expect(
      uninstallModulePackage({
        modulesRoot: 'modules',
        moduleId: '../../outside',
        version: '1.0.0',
      }),
    ).rejects.toThrow('Invalid module ID: "../../outside".');
  });

  it('rejects an invalid module version when uninstalling', async () => {
    await expect(
      uninstallModulePackage({
        modulesRoot: 'modules',
        moduleId: 'org.familietools.test',
        version: '../1.0.0',
      }),
    ).rejects.toThrow('Invalid module version: "../1.0.0".');
  });
});
