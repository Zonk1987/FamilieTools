import { isValidModuleId, isValidModuleVersion } from '@familietools/module-schema';

export function validateModuleId(moduleId: string): void {
  if (!isValidModuleId(moduleId)) {
    throw new Error(`Invalid module ID: "${moduleId}".`);
  }
}

export function validateModuleVersion(version: string): void {
  if (!isValidModuleVersion(version)) {
    throw new Error(`Invalid module version: "${version}".`);
  }
}
