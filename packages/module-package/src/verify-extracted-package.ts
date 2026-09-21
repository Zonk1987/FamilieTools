import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { ModulePackageInspection } from './types.js';

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export async function verifyExtractedPackage(
  extractionPath: string,
  inspection: ModulePackageInspection,
): Promise<void> {
  for (const entry of inspection.entries) {
    if (entry.isDirectory) {
      continue;
    }

    const filePath = path.join(extractionPath, ...entry.path.split('/'));

    const content = await fs.readFile(filePath);

    const actualHash = sha256(content);

    if (actualHash !== entry.sha256) {
      throw new Error(`Extracted file hash mismatch: "${entry.path}"`);
    }
  }
}
