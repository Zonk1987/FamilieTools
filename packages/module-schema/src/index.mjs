import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, '..', 'module-manifest.schema.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

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

export function validateModuleManifest(manifest) {
  const valid = validate(manifest);

  return {
    valid,
    errors: valid ? [] : structuredClone(validate.errors ?? []),
  };
}
