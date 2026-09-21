import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(packageRoot, 'module-manifest.schema.json');
const validExamplesRoot = path.join(packageRoot, 'examples');
const invalidExamplesRoot = path.join(packageRoot, 'examples-invalid');

const readJson = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
};

const findJsonFiles = async (directory) => {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          return findJsonFiles(fullPath);
        }

        if (entry.isFile() && entry.name.endsWith('.json')) {
          return [fullPath];
        }

        return [];
      }),
    );

    return files.flat();
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const formatValidationErrors = (errors) =>
  (errors ?? []).map((error) => {
    const location = error.instancePath || '/';
    const message = error.message ?? 'validation error';

    return `  ${location} ${message}`;
  });

const schema = await readJson(schemaPath);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});

addFormats(ajv);

ajv.addFormat('semver-range', {
  type: 'string',
  validate: (value) => semver.validRange(value) !== null,
});

ajv.addFormat('module-path', {
  type: 'string',
  validate: (value) => {
    if (value.length === 0) {
      return false;
    }

    if (value.includes('\0')) {
      return false;
    }

    if (
      value.startsWith('/') ||
      value.startsWith('\\') ||
      value.startsWith('./') ||
      value.startsWith('.\\')
    ) {
      return false;
    }

    if (/^[A-Za-z]:[\\/]/.test(value)) {
      return false;
    }

    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
      return false;
    }

    const normalized = value.replaceAll('\\', '/');

    const segments = normalized.split('/');

    if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
      return false;
    }

    return true;
  },
});

const validate = ajv.compile(schema);

const validExampleFiles = await findJsonFiles(validExamplesRoot);
const invalidExampleFiles = await findJsonFiles(invalidExamplesRoot);

let hasErrors = false;

console.log('Valid module manifests\n');

if (validExampleFiles.length === 0) {
  console.error('✗ No valid example module manifests found.');
  hasErrors = true;
} else {
  for (const filePath of validExampleFiles) {
    const manifest = await readJson(filePath);
    const relativePath = path.relative(packageRoot, filePath);

    const valid = validate(manifest);

    if (valid) {
      console.log(`✓ ${relativePath}`);
      continue;
    }

    hasErrors = true;
    console.error(`✗ ${relativePath} should be valid`);

    for (const line of formatValidationErrors(validate.errors)) {
      console.error(line);
    }
  }
}

console.log('\nInvalid module manifests\n');

if (invalidExampleFiles.length === 0) {
  console.error('✗ No invalid example module manifests found.');
  hasErrors = true;
} else {
  for (const filePath of invalidExampleFiles) {
    const manifest = await readJson(filePath);
    const relativePath = path.relative(packageRoot, filePath);

    const valid = validate(manifest);

    if (!valid) {
      console.log(`✓ ${relativePath} rejected as expected`);
      continue;
    }

    hasErrors = true;
    console.error(`✗ ${relativePath} should have been rejected`);
  }
}

console.log(
  `\nValidated ${validExampleFiles.length} valid and ${invalidExampleFiles.length} invalid module manifest(s).`,
);

if (hasErrors) {
  process.exitCode = 1;
}
