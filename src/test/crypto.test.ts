import { decryptText, encryptText, generateKeyB64, isEncrypted } from '../../supabase/functions/_shared/crypto.ts';

describe('stored message encryption (AES-256-GCM)', () => {
  it('round-trips text, including Gujarati and Hindi', async () => {
    const key = generateKeyB64();
    for (const text of ['I helped a neighbour', 'આજે મેં મદદ કરી', 'आज मैंने सेवा की']) {
      const stored = await encryptText(text, key);
      expect(await decryptText(stored, key)).toBe(text);
    }
  });

  it('never stores the plain text and marks the value as encrypted', async () => {
    const key = generateKeyB64();
    const stored = await encryptText('my private diary', key);
    expect(isEncrypted(stored)).toBe(true);
    expect(stored).not.toContain('private');
    expect(stored.startsWith('enc:v1:')).toBe(true);
  });

  it('uses a fresh random IV so the same text encrypts differently each time', async () => {
    const key = generateKeyB64();
    expect(await encryptText('same', key)).not.toBe(await encryptText('same', key));
  });

  it('cannot be decrypted with another key, and tampering is detected', async () => {
    const stored = await encryptText('secret', generateKeyB64());
    await expect(decryptText(stored, generateKeyB64())).rejects.toThrow();
    const key = generateKeyB64();
    const good = await encryptText('secret', key);
    const tampered = `${good.slice(0, -4)}AAAA`;
    await expect(decryptText(tampered, key)).rejects.toThrow();
  });

  it('rejects keys that are not 32 bytes', async () => {
    await expect(encryptText('x', btoa('short'))).rejects.toThrow(/32 bytes/);
  });
});
