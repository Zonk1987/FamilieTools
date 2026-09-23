const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getAllowedWebOrigins(): string[] {
  const configuredOrigins = process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;

  return [
    ...new Set(
      configuredOrigins
        .split(',')
        .map(normalizeOrigin)
        .filter((origin) => origin.length > 0),
    ),
  ];
}

export function isAllowedWebOrigin(origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);

  return getAllowedWebOrigins().includes(normalizedOrigin);
}
