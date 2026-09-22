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
});
