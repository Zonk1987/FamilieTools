export function getTrustedProxies(): string[] | false {
  const configured = process.env.TRUSTED_PROXIES?.trim();

  if (!configured) {
    return false;
  }

  const proxies = configured
    .split(',')
    .map((proxy) => proxy.trim())
    .filter((proxy) => proxy.length > 0);

  return proxies.length > 0 ? [...new Set(proxies)] : false;
}
