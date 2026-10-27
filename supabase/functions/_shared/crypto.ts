// AES-256-GCM encryption for stored diary text. WebCrypto only, so it runs in Deno, browsers and Node 20+.
//
// Stored format:  enc:v1:<base64 iv>.<base64 ciphertext+tag>
// The app never decrypts or displays a saved message: the ciphertext exists only to protect data at rest.

const PREFIX = 'enc:v1:';

const toB64 = (b: Uint8Array): string => {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
};
const fromB64 = (s: string) => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const isEncrypted = (s: string | null | undefined): boolean => typeof s === 'string' && s.startsWith(PREFIX);

/** A new random 256-bit key, base64 encoded (use as the TRANSCRIPT_KEY secret). */
export function generateKeyB64(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(32)));
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = fromB64(keyB64);
  if (raw.length !== 32) throw new Error('encryption key must be 32 bytes (base64)');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptText(plain: string, keyB64: string): Promise<string> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
  return `${PREFIX}${toB64(iv)}.${toB64(ct)}`;
}

export async function decryptText(stored: string, keyB64: string): Promise<string> {
  if (!isEncrypted(stored)) throw new Error('not an encrypted value');
  const [ivB64, ctB64] = stored.slice(PREFIX.length).split('.');
  const key = await importKey(keyB64);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(ivB64) }, key, fromB64(ctB64));
  return new TextDecoder().decode(pt);
}
