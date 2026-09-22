import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listInstalledModuleVersions } from '../src/list-installed-module-versions.js';

describe('listInstalledModuleVersions', () => {
  let tempRoot: string;
  let modulesRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-module-list-'));

    modulesRoot = path.join(tempRoot, 'modules');

    await fs.mkdir(modulesRoot, {
      recursive: true,
    });
  });

  afterEach(async () => {
    await fs.rm(tempRoot, {
      recursive: true,
      force: true,
    });
  });

  it('returns an empty list when the module does not exist', async () => {
    const versions = await listInstalledModuleVersions(modulesRoot, 'org.familietools.calendar');

    expect(versions).toEqual([]);
  });

  it('lists installed module versions', async () => {
    const moduleId = 'org.familietools.calendar';

    const moduleRoot = path.join(modulesRoot, moduleId);

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '2.0.0'), {
      recursive: true,
    });

    const versions = await listInstalledModuleVersions(modulesRoot, moduleId);

    expect(versions).toEqual(['1.0.0', '2.0.0']);
  });

  it('sorts installed versions using semantic version order', async () => {
    const moduleId = 'org.familietools.calendar';

    const moduleRoot = path.join(modulesRoot, moduleId);

    await fs.mkdir(path.join(moduleRoot, '1.10.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '1.2.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '2.0.0'), {
      recursive: true,
    });

    const versions = await listInstalledModuleVersions(modulesRoot, moduleId);

    expect(versions).toEqual(['1.2.0', '1.10.0', '2.0.0']);
  });

  it('ignores hidden internal directories', async () => {
    const moduleId = 'org.familietools.calendar';

    const moduleRoot = path.join(modulesRoot, moduleId);

    await fs.mkdir(path.join(moduleRoot, '1.0.0'), {
      recursive: true,
    });

    await fs.mkdir(path.join(moduleRoot, '.1.0.0.installing'), {
      recursive: true,
    });

    const versions = await listInstalledModuleVersions(modulesRoot, moduleId);

    expect(versions).toEqual(['1.0.0']);
  });

  it('rejects an invalid module ID', async () => {
    await expect(listInstalledModuleVersions(modulesRoot, '../../outside')).rejects.toThrow(
      'Invalid module ID: "../../outside".',
    );
  });

  it('rejects invalid version directories', async () => {
    const moduleId = 'org.familietools.calendar';

    const moduleRoot = path.join(modulesRoot, moduleId);

    await fs.mkdir(path.join(moduleRoot, 'not-a-version'), {
      recursive: true,
    });

    await expect(listInstalledModuleVersions(modulesRoot, moduleId)).rejects.toThrow(
      'Invalid module version: "not-a-version".',
    );
  });
});
