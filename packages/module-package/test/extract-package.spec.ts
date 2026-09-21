import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { strToU8, zipSync } from 'fflate';
import { afterEach, describe, expect, it } from 'vitest';

import { extractModulePackage } from '../src/extract-package.js';

const cleanupPaths: string[] = [];

function createValidManifest() {
  return {
    manifestVersion: 1,
    id: 'org.familietools.test',
    name: 'Test Module',
    version: '1.0.0',
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

describe('extractModulePackage', () => {
  it('extracts a valid module package into a temporary directory', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-test-'));

    cleanupPaths.push(tempRoot);

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/backend/index.js': 'export default {};',
      'assets/example.txt': 'hello',
    });

    const result = await extractModulePackage(archive, {
      tempRoot,
    });

    const moduleJson = await fs.readFile(path.join(result.extractionPath, 'module.json'), 'utf8');

    const backend = await fs.readFile(
      path.join(result.extractionPath, 'dist', 'backend', 'index.js'),
      'utf8',
    );

    expect(JSON.parse(moduleJson).id).toBe('org.familietools.test');

    expect(backend).toBe('export default {};');

    expect(result.inspection.manifest.id).toBe('org.familietools.test');
  });

  it('creates a unique extraction directory', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-test-'));

    cleanupPaths.push(tempRoot);

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
    });

    const first = await extractModulePackage(archive, {
      tempRoot,
    });

    const second = await extractModulePackage(archive, {
      tempRoot,
    });

    expect(first.extractionPath).not.toBe(second.extractionPath);
  });
});
