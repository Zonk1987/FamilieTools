export type SessionCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  expires?: Date;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isSecureCookieForced(): boolean {
  return process.env.SESSION_COOKIE_SECURE === 'true';
}

export function shouldUseSecureSessionCookie(): boolean {
  if (isSecureCookieForced()) {
    return true;
  }

  return isProduction();
}

export function getSessionCookieOptions(expires: Date): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: shouldUseSecureSessionCookie(),
    sameSite: 'lax',
    path: '/',
    expires,
  };
}

export function getClearSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: shouldUseSecureSessionCookie(),
    sameSite: 'lax',
    path: '/',
  };
}
