export interface ModuleManifestPublisher {
  id: string;
  name: string;
  website?: string;
}

export interface ModuleManifestCompatibility {
  platform: string;
  moduleApi: string;
  node?: string;
}

export interface ModuleManifestDependency {
  id: string;
  version: string;
}

export interface ModuleManifestEntrypoints {
  backend?: string;
  frontend?: string;
  jobs?: string[];
}

export interface ModuleManifest {
  $schema?: string;
  manifestVersion: 1;
  id: string;
  name: string;
  version: string;
  description?: string;
  publisher: ModuleManifestPublisher;
  license?: string;

  compatibility: ModuleManifestCompatibility;

  permissions?: string[];

  network?: {
    allowedHosts?: string[];
  };

  dependencies?: {
    required?: ModuleManifestDependency[];
    optional?: ModuleManifestDependency[];
  };

  entrypoints: ModuleManifestEntrypoints;

  migrations?: string[];

  storage?: {
    private?: boolean;
    quota?: number;
  };

  contributions?: {
    widgets?: Array<{
      id: string;
      name: string;
      component: string;
      defaultSize?: {
        width: number;
        height: number;
      };
      configSchema?: string;
    }>;

    navigation?: Array<{
      id: string;
      label: string;
      route: string;
      icon?: string;
      order?: number;
    }>;

    routes?: Array<{
      id: string;
      path: string;
      component: string;
    }>;

    settings?: Array<{
      id: string;
      schema: string;
    }>;

    quickActions?: Array<{
      id: string;
      label: string;
      action: string;
      icon?: string;
    }>;
  };
}

export interface ModuleManifestValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

export type ModuleManifestValidationResult =
  | {
      valid: true;
      errors: [];
    }
  | {
      valid: false;
      errors: ModuleManifestValidationError[];
    };

export function validateModuleManifest(manifest: unknown): ModuleManifestValidationResult;

export function isValidModuleId(value: unknown): value is string;

export function isValidModuleVersion(value: unknown): value is string;
