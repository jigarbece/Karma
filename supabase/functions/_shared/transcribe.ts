// Speech to text for browsers whose built-in voice typing cannot do Gujarati (or anything at all).
// The app records a short clip and the Edge Function sends it to Whisper on Groq, which knows Gujarati, Hindi and English.
// The clip is held in memory for the one request and is never stored. The key only lives in Edge Function secrets.

export type VoiceLang = 'gu' | 'hi' | 'en';

/** Largest clip accepted, in bytes. 60 seconds of compressed speech is well under this. */
export const MAX_AUDIO_BYTES = 3_000_000;

const EXTENSION: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
};

/** File extension Groq needs to recognise the container; "audio/webm;codecs=opus" -> "webm". */
export function audioExtension(mime: string): string {
  return EXTENSION[mime.split(';')[0].trim().toLowerCase()] ?? 'webm';
}

/** TRANSCRIBE_API_KEY, else the Groq key already used for scoring (primary or fallback provider). */
export function pickTranscribeKey(get: (name: string) => string | undefined): string | undefined {
  if (get('TRANSCRIBE_API_KEY')) return get('TRANSCRIBE_API_KEY');
  if (get('AI_PROVIDER')?.toLowerCase() === 'groq' && get('AI_API_KEY')) return get('AI_API_KEY');
  if (get('AI_FALLBACK_PROVIDER')?.toLowerCase() === 'groq' && get('AI_FALLBACK_API_KEY')) return get('AI_FALLBACK_API_KEY');
  return undefined;
}

/** Every Groq key available, in order: the single key above plus any extra AI_API_KEYS. They are tried in turn on a rate limit. */
export function pickTranscribeKeys(get: (name: string) => string | undefined): string[] {
  const first = pickTranscribeKey(get);
  if (!first) return [];
  const extra = get('TRANSCRIBE_API_KEY') || get('AI_PROVIDER')?.toLowerCase() !== 'groq' ? [] : (get('AI_API_KEYS') ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  return [...new Set([first, ...extra])];
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const DEFAULT_TRANSCRIBE_MODEL = 'whisper-large-v3';

interface WhisperReply {
  text?: string;
  segments?: Array<{ text?: string; no_speech_prob?: number; avg_logprob?: number }>;
}

/** Keeps only segments that were really speech. Without segment data (older replies) the plain text is used. */
export function speechText(reply: WhisperReply): string {
  if (!Array.isArray(reply.segments)) return (reply.text ?? '').trim();
  return reply.segments
    .filter((s) => (s.no_speech_prob ?? 0) < 0.6 && (s.avg_logprob ?? 0) > -1.2)
    .map((s) => (s.text ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

export async function transcribeAudio(opts: {
  bytes: Uint8Array;
  mime: string;
  language: VoiceLang;
  /** one key, or several: a key that is rate limited is skipped for the next */
  apiKey: string | string[];
  model?: string;
  f?: typeof fetch;
  retryDelayMs?: number;
}): Promise<string> {
  const { bytes, mime, language, model = DEFAULT_TRANSCRIBE_MODEL, f = fetch, retryDelayMs = 800 } = opts;
  const keys = Array.isArray(opts.apiKey) ? opts.apiKey : [opts.apiKey];
  if (bytes.length === 0) return '';
  if (bytes.length > MAX_AUDIO_BYTES) throw new Error('audio_too_large');

  let keyIndex = 0;
  for (let attempt = 0; ; attempt++) {
    const apiKey = keys[keyIndex];
    // a fresh form each time: a body can only be read once
    const form = new FormData();
    form.append('file', new Blob([bytes as unknown as BlobPart], { type: mime.split(';')[0] }), `voice.${audioExtension(mime)}`);
    form.append('model', model);
    form.append('language', language);
    // verbose_json carries a no-speech probability per segment; Whisper invents words for silence and noise otherwise
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');
    const res = await f('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (res.ok) return speechText((await res.json()) as WhisperReply);
    if (res.status === 429 && keyIndex < keys.length - 1) {
      keyIndex++; // quota used up on this key: hand over to the next one at once
      attempt--;
      continue;
    }
    if ([429, 500, 502, 503, 504].includes(res.status) && attempt < 1) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      continue;
    }
    throw new Error(`Speech-to-text error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
