import type { ModuleManifest } from '@familietools/module-schema';

export type ArchivePathValidationResult =
  | {
      valid: true;
      normalizedPath: string;
    }
  | {
      valid: false;
      reason: string;
    };

export interface ModulePackageEntry {
  path: string;
  size: number;
  compressedSize?: number;
  isDirectory: boolean;
  sha256: string;
}

export interface ModulePackageInspection {
  entries: ModulePackageEntry[];
  fileCount: number;
  totalUncompressedSize: number;
  hasManifest: boolean;
  manifest: ModuleManifest;
  packageSha256: string;
}

export interface ModulePackageInspectionOptions {
  maxArchiveSize?: number;
  maxFileCount?: number;
  maxTotalUncompressedSize?: number;
}
