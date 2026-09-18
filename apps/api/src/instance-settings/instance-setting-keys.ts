export const INSTANCE_SETTING_KEYS = [
  'instance.name',
  'instance.publicUrl',
  'instance.defaultLanguage',
  'instance.defaultTimezone',
  'registration.mode',
  'uploads.maxFileSize',
  'uploads.allowedMimeTypes',
  'theme.defaultThemeId',
  'modules.defaultState',
] as const;

export type InstanceSettingKey = (typeof INSTANCE_SETTING_KEYS)[number];
