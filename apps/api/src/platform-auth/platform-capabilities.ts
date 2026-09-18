export const PLATFORM_CAPABILITIES = [
  'platform.admin.access',

  'platform.users.read',
  'platform.users.manage',

  'platform.families.read',
  'platform.families.manage',

  'platform.modules.read',
  'platform.modules.manage',

  'platform.themes.read',
  'platform.themes.manage',

  'platform.system.read',
  'platform.system.manage',

  'platform.settings.read',
  'platform.settings.manage',

  'platform.audit.read',

  'platform.backups.manage',
  'platform.updates.manage',
] as const;

export type PlatformCapability = (typeof PLATFORM_CAPABILITIES)[number];

export const PLATFORM_OWNER_ROLE_KEY = 'platform_owner';
