import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { strToU8, zipSync } from 'fflate';
import { afterEach, describe, expect, it } from 'vitest';

import { extractModulePackage } from '../src/extract-package.js';
import { verifyExtractedPackage } from '../src/verify-extracted-package.js';

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

describe('verifyExtractedPackage', () => {
  it('accepts unchanged extracted files', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-test-'));

    cleanupPaths.push(tempRoot);

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/example.txt': 'original content',
    });

    const result = await extractModulePackage(archive, {
      tempRoot,
    });

    await expect(
      verifyExtractedPackage(result.extractionPath, result.inspection),
    ).resolves.toBeUndefined();
  });

  it('rejects modified extracted files', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'familietools-test-'));

    cleanupPaths.push(tempRoot);

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/example.txt': 'original content',
    });

    const result = await extractModulePackage(archive, {
      tempRoot,
    });

    await fs.writeFile(
      path.join(result.extractionPath, 'assets', 'example.txt'),
      'tampered content',
    );

    await expect(verifyExtractedPackage(result.extractionPath, result.inspection)).rejects.toThrow(
      'Extracted file hash mismatch: "assets/example.txt"',
    );
  });
});
