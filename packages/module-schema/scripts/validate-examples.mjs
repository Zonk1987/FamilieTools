import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateModuleManifest } from '../src/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageRoot = path.resolve(__dirname, '..');

const validRoot = path.join(packageRoot, 'examples');

const invalidRoot = path.join(packageRoot, 'examples-invalid');

function findManifestFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(root, {
    withFileTypes: true,
  })) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      results.push(...findManifestFiles(entryPath));

      continue;
    }

    if (entry.name === 'module.json') {
      results.push(entryPath);
    }
  }

  return results.sort();
}

function readManifest(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relativePath(filePath) {
  return path.relative(packageRoot, filePath);
}

const validFiles = findManifestFiles(validRoot);

const invalidFiles = findManifestFiles(invalidRoot);

console.log('Valid module manifests\n');

for (const filePath of validFiles) {
  const manifest = readManifest(filePath);

  const result = validateModuleManifest(manifest);

  if (!result.valid) {
    console.error(`✗ ${relativePath(filePath)} was rejected`);

    for (const error of result.errors) {
      console.error(`  ${error.instancePath || '/'} ${error.message ?? 'validation error'}`);
    }

    process.exitCode = 1;

    continue;
  }

  console.log(`✓ ${relativePath(filePath)}`);
}

console.log('\nInvalid module manifests\n');

for (const filePath of invalidFiles) {
  let manifest;

  try {
    manifest = readManifest(filePath);
  } catch {
    console.log(`✓ ${relativePath(filePath)} rejected as expected`);

    continue;
  }

  const result = validateModuleManifest(manifest);

  if (result.valid) {
    console.error(`✗ ${relativePath(filePath)} was accepted but should be invalid`);

    process.exitCode = 1;

    continue;
  }

  console.log(`✓ ${relativePath(filePath)} rejected as expected`);
}

console.log(
  `\nValidated ${validFiles.length} valid and ${invalidFiles.length} invalid module manifest(s).`,
);
