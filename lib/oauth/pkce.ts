const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

function getCrypto(): Crypto | null {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto;
  }
  return null;
}

function randomString(length: number): string {
  const crypto = getCrypto();
  if (!crypto) {
    let str = '';
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * ALPHANUMERIC.length);
      str += ALPHANUMERIC[index];
    }
    return str;
  }

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (value) => ALPHANUMERIC[value % ALPHANUMERIC.length]).join('');
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Web Crypto API not available for PKCE generation.');
  }
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(input));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomString(128);
  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}

export function savePkceSession(sessionId: string, payload: { verifier: string; state: string; redirectUri: string }) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`pkce:${sessionId}`, JSON.stringify(payload));
}

export function loadPkceSession(sessionId: string) {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`pkce:${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { verifier: string; state: string; redirectUri: string };
  } catch (error) {
    console.warn('[pkce] Failed to parse session storage PKCE payload', error);
    return null;
  }
}

export function clearPkceSession(sessionId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`pkce:${sessionId}`);
}
