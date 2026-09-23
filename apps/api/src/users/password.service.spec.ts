import { describe, expect, it } from 'vitest';

import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', async () => {
    const password = 'very-secure-password';

    const hash = await service.hash(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('scrypt$')).toBe(true);

    await expect(service.verify(password, hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('very-secure-password');

    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects an invalid stored hash', async () => {
    await expect(service.verify('very-secure-password', 'invalid-hash')).resolves.toBe(false);
  });

  it('rejects an excessive scrypt N parameter', async () => {
    const service = new PasswordService();

    const salt = Buffer.alloc(32).toString('base64url');
    const hash = Buffer.alloc(64).toString('base64url');

    const storedHash = `scrypt$1048577$8$1$${salt}$${hash}`;

    await expect(service.verify('password', storedHash)).resolves.toBe(false);
  });

  it('rejects an excessive scrypt r parameter', async () => {
    const service = new PasswordService();

    const salt = Buffer.alloc(32).toString('base64url');
    const hash = Buffer.alloc(64).toString('base64url');

    const storedHash = `scrypt$16384$33$1$${salt}$${hash}`;

    await expect(service.verify('password', storedHash)).resolves.toBe(false);
  });

  it('rejects an excessive scrypt p parameter', async () => {
    const service = new PasswordService();

    const salt = Buffer.alloc(32).toString('base64url');
    const hash = Buffer.alloc(64).toString('base64url');

    const storedHash = `scrypt$16384$8$17$${salt}$${hash}`;

    await expect(service.verify('password', storedHash)).resolves.toBe(false);
  });

  it('rejects an invalid scrypt salt length', async () => {
    const service = new PasswordService();

    const salt = Buffer.alloc(16).toString('base64url');
    const hash = Buffer.alloc(64).toString('base64url');

    const storedHash = `scrypt$16384$8$1$${salt}$${hash}`;

    await expect(service.verify('password', storedHash)).resolves.toBe(false);
  });
});
