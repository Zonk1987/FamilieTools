const MODULE_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/;

const VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function validateModuleId(moduleId: string): void {
  if (!MODULE_ID_PATTERN.test(moduleId)) {
    throw new Error(`Invalid module ID: "${moduleId}".`);
  }
}

export function validateModuleVersion(version: string): void {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid module version: "${version}".`);
  }
}
