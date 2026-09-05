/**
 * Lightweight JWT decoding & validation utility.
 * Safe for Edge runtime (middleware), Node.js, and browser environments.
 */

function decodeBase64(str: string): string {
  if (typeof atob === 'function') {
    return atob(str);
  }
  return Buffer.from(str, 'base64').toString('binary');
}

export interface DecodedJwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  employeeId?: string | null;
  organizationId?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export function decodeJwt<T = DecodedJwtPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binary = decodeBase64(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== 'number') {
    // If we can't parse the token, consider it invalid/expired
    return !payload;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}
