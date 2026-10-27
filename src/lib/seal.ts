import { encryptText, generateKeyB64 } from '../../supabase/functions/_shared/crypto.ts';

const KEY_STORE = 'karma.k';

/** Per-browser key for the local demo / dev paths. Real accounts are sealed by the server with TRANSCRIPT_KEY. */
function localKey(): string {
  try {
    let k = localStorage.getItem(KEY_STORE);
    if (!k) {
      k = generateKeyB64();
      localStorage.setItem(KEY_STORE, k);
    }
    return k;
  } catch {
    return generateKeyB64(); // storage unavailable: encrypt with a throwaway key (text is never read back)
  }
}

/** Encrypt a message before it is saved on this device. It is never decrypted or displayed. */
export function sealLocal(plain: string): Promise<string> {
  return encryptText(plain, localKey());
}
