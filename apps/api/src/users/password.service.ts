import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

const MAX_SCRYPT_N = 1 << 20;
const MAX_SCRYPT_R = 32;
const MAX_SCRYPT_P = 16;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);

    const derivedKey = await this.deriveKey(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);

    return [
      'scrypt',
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    try {
      const parts = storedHash.split('$');

      if (parts.length !== 6) {
        return false;
      }

      const [algorithm, nValue, rValue, pValue, saltValue, hashValue] = parts;

      if (algorithm !== 'scrypt' || !nValue || !rValue || !pValue || !saltValue || !hashValue) {
        return false;
      }

      const n = Number(nValue);
      const r = Number(rValue);
      const p = Number(pValue);

      if (
        !Number.isSafeInteger(n) ||
        !Number.isSafeInteger(r) ||
        !Number.isSafeInteger(p) ||
        n <= 1 ||
        r <= 0 ||
        p <= 0 ||
        n > MAX_SCRYPT_N ||
        r > MAX_SCRYPT_R ||
        p > MAX_SCRYPT_P
      ) {
        return false;
      }

      const salt = Buffer.from(saltValue, 'base64url');

      const expectedHash = Buffer.from(hashValue, 'base64url');

      if (salt.length !== SALT_LENGTH || expectedHash.length !== KEY_LENGTH) {
        return false;
      }

      const actualHash = await this.deriveKey(password, salt, n, r, p);

      return timingSafeEqual(expectedHash, actualHash);
    } catch {
      return false;
    }
  }

  private deriveKey(
    password: string,
    salt: Buffer,
    n: number,
    r: number,
    p: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        KEY_LENGTH,
        {
          N: n,
          r,
          p,
        },
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(derivedKey);
        },
      );
    });
  }
}
