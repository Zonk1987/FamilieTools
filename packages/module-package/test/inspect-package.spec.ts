import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { inspectModulePackage, MAX_ARCHIVE_SIZE, MAX_FILE_COUNT } from '../src/inspect-package.js';

function createArchive(files: Record<string, string>): Uint8Array {
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, content]) => [path, strToU8(content)])),
  );
}

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

describe('inspectModulePackage', () => {
  it('supports custom archive size limits', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
    });

    expect(() =>
      inspectModulePackage(archive, {
        maxArchiveSize: 1,
      }),
    ).toThrow('Module package exceeds maximum archive size.');
  });

  it('rejects a package that exceeds a custom uncompressed size limit', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/example.txt': '1234567890',
    });

    expect(() =>
      inspectModulePackage(archive, {
        maxTotalUncompressedSize: 10,
      }),
    ).toThrow('Module package exceeds maximum declared uncompressed size.');
  });

  it('rejects an archive that exceeds the maximum archive size', () => {
    const archive = new Uint8Array(MAX_ARCHIVE_SIZE + 1);

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package exceeds maximum archive size.',
    );
  });

  it('rejects a package that exceeds the maximum file count', () => {
    const files: Record<string, string> = {
      'module.json': JSON.stringify(createValidManifest()),
    };

    for (let index = 0; index < MAX_FILE_COUNT; index += 1) {
      files[`files/file-${index}.txt`] = 'x';
    }

    const archive = createArchive(files);

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package exceeds maximum file count.',
    );
  });
  it('accepts a valid module package', () => {
    const archive = createArchive({
      'module.json': JSON.stringify({
        manifestVersion: 1,
        id: 'org.familietools.calendar',
        name: 'Calendar',
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
          frontend: 'dist/frontend/index.js',
        },
      }),
      'dist/backend/index.js': 'export default {};',
      'dist/frontend/index.js': 'export default {};',
      'migrations/0001_initial.sql': 'CREATE TABLE example ();',
    });

    const result = inspectModulePackage(archive);

    expect(result.packageSha256).toMatch(/^[a-f0-9]{64}$/);

    const manifestEntry = result.entries.find((entry) => entry.path === 'module.json');

    expect(manifestEntry).toBeDefined();
    expect(manifestEntry?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.hasManifest).toBe(true);
    expect(result.manifest.id).toBe('org.familietools.calendar');
    expect(result.manifest.name).toBe('Calendar');
    expect(result.manifest.version).toBe('1.0.0');
    expect(result.manifest.manifestVersion).toBe(1);
    expect(result.fileCount).toBe(4);
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'module.json',
          isDirectory: false,
        }),
        expect.objectContaining({
          path: 'dist/backend/index.js',
          isDirectory: false,
        }),
      ]),
    );
  });

  it('calculates the SHA-256 hash of the complete package', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
    });

    const expectedHash = createHash('sha256').update(archive).digest('hex');

    const result = inspectModulePackage(archive);

    expect(result.packageSha256).toBe(expectedHash);
  });

  it('rejects a package without module.json', () => {
    const archive = createArchive({
      'dist/backend/index.js': 'export default {};',
    });

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package must contain module.json in archive root.',
    );
  });

  it('rejects parent-directory traversal', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      '../outside.js': 'malicious',
    });

    expect(() => inspectModulePackage(archive)).toThrow(/Unsafe archive entry/);
  });

  it('rejects backslash parent-directory traversal', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      '..\\outside.js': 'malicious',
    });

    expect(() => inspectModulePackage(archive)).toThrow(/Unsafe archive entry/);
  });

  it('rejects absolute paths', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      '/etc/passwd': 'malicious',
    });

    expect(() => inspectModulePackage(archive)).toThrow(/Unsafe archive entry/);
  });

  it('reports the total uncompressed size', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/example.txt': '1234567890',
    });

    const result = inspectModulePackage(archive);

    const manifest = JSON.stringify(createValidManifest());

    const expectedSize = strToU8(manifest).byteLength + strToU8('1234567890').byteLength;

    expect(result.totalUncompressedSize).toBe(expectedSize);
  });
  it('rejects invalid JSON in module.json', () => {
    const archive = createArchive({
      'module.json': '{ invalid json',
    });

    expect(() => inspectModulePackage(archive)).toThrow('module.json contains invalid JSON.');
  });

  it('rejects a schema-invalid module manifest', () => {
    const archive = createArchive({
      'module.json': JSON.stringify({
        manifestVersion: 1,
        name: 'Broken Module',
        version: '1.0.0',
      }),
    });

    expect(() => inspectModulePackage(archive)).toThrow(/Invalid module manifest/);
  });

  it('calculates SHA-256 hashes for archive entries', () => {
    const fileContent = 'Hello FamilieTools';

    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/example.txt': fileContent,
    });

    const result = inspectModulePackage(archive);

    const entry = result.entries.find((item) => item.path === 'assets/example.txt');

    const expectedHash = createHash('sha256').update(strToU8(fileContent)).digest('hex');

    expect(entry?.sha256).toBe(expectedHash);
  });

  it('rejects archive paths that collide after separator normalization', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/widget.js': 'first',
      'dist\\widget.js': 'second',
    });

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package contains colliding archive path: "dist\\widget.js".',
    );
  });

  it('rejects archive paths that differ only by letter case', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'dist/Widget.js': 'first',
      'dist/widget.js': 'second',
    });

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package contains colliding archive path: "dist/widget.js".',
    );
  });

  it('rejects a file path that conflicts with a child path', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      assets: 'this is a file',
      'assets/icon.png': 'fake image',
    });

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package contains file/directory path conflict: "assets/icon.png".',
    );
  });

  it('rejects a file path that conflicts with an existing child path', () => {
    const archive = createArchive({
      'module.json': JSON.stringify(createValidManifest()),
      'assets/icon.png': 'fake image',
      assets: 'this is a file',
    });

    expect(() => inspectModulePackage(archive)).toThrow(
      'Module package contains file/directory path conflict: "assets".',
    );
  });
});
