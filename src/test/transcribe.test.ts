import { audioExtension, base64ToBytes, pickTranscribeKey, pickTranscribeKeys, speechText, transcribeAudio } from '../../supabase/functions/_shared/transcribe';

const ok = (text: string) => new Response(JSON.stringify({ text }), { status: 200 });

describe('speech to text (Gujarati voice for any phone)', () => {
  it('maps recording formats to the file extension Groq needs', () => {
    expect(audioExtension('audio/webm;codecs=opus')).toBe('webm');
    expect(audioExtension('audio/mp4')).toBe('mp4');
    expect(audioExtension('audio/ogg;codecs=opus')).toBe('ogg');
    expect(audioExtension('AUDIO/X-M4A')).toBe('m4a');
    expect(audioExtension('something/else')).toBe('webm');
  });

  it('finds a Groq key: its own, the scoring key, or the fallback key', () => {
    expect(pickTranscribeKey((n) => ({ TRANSCRIBE_API_KEY: 'own', AI_PROVIDER: 'groq', AI_API_KEY: 'score' })[n])).toBe('own');
    expect(pickTranscribeKey((n) => ({ AI_PROVIDER: 'groq', AI_API_KEY: 'score' })[n])).toBe('score');
    expect(pickTranscribeKey((n) => ({ AI_PROVIDER: 'gemini', AI_API_KEY: 'g', AI_FALLBACK_PROVIDER: 'groq', AI_FALLBACK_API_KEY: 'fb' })[n])).toBe('fb');
    expect(pickTranscribeKey((n) => ({ AI_PROVIDER: 'gemini', AI_API_KEY: 'g' })[n])).toBeUndefined();
  });

  it('drops segments Whisper flags as silence or noise, keeps real speech', () => {
    expect(speechText({ text: 'invented', segments: [{ text: 'invented', no_speech_prob: 0.9, avg_logprob: -0.3 }] })).toBe('');
    expect(speechText({ text: 'x', segments: [{ text: 'mumble', no_speech_prob: 0.1, avg_logprob: -2 }] })).toBe('');
    expect(speechText({ text: 'a b', segments: [
      { text: ' મેં દાન કર્યું ', no_speech_prob: 0.05, avg_logprob: -0.2 },
      { text: 'Thank you', no_speech_prob: 0.8, avg_logprob: -0.5 },
      { text: 'અને મદદ કરી', no_speech_prob: 0.1, avg_logprob: -0.4 },
    ] })).toBe('મેં દાન કર્યું અને મદદ કરી');
    expect(speechText({ text: ' plain ' })).toBe('plain');
  });

  it('lists every Groq key for voice, and skips one whose quota is used up', async () => {
    const env: Record<string, string> = { AI_PROVIDER: 'groq', AI_API_KEY: 'a', AI_API_KEYS: 'b,c' };
    expect(pickTranscribeKeys((n) => env[n])).toEqual(['a', 'b', 'c']);
    expect(pickTranscribeKeys((n) => ({ TRANSCRIBE_API_KEY: 'own', ...env })[n])).toEqual(['own']);
    expect(pickTranscribeKeys(() => undefined)).toEqual([]);
    const used: string[] = [];
    const f = vi.fn(async (_u: string, init: RequestInit) => {
      const key = (init.headers as Record<string, string>).authorization.replace('Bearer ', '');
      used.push(key);
      return key === 'c' ? ok('hello') : new Response('limit', { status: 429 });
    });
    expect(await transcribeAudio({ bytes: new Uint8Array([1]), mime: 'audio/webm', language: 'en', apiKey: ['a', 'b', 'c'], f: f as unknown as typeof fetch })).toBe('hello');
    expect(used).toEqual(['a', 'b', 'c']);
  });

  it('decodes base64 audio', () => {
    expect([...base64ToBytes(btoa('abc'))]).toEqual([97, 98, 99]);
  });

  it('sends the clip with the language, model and key in the header, and returns the text', async () => {
    const f = vi.fn().mockResolvedValue(ok('  મેં આજે દાન કર્યું  '));
    const text = await transcribeAudio({ bytes: new Uint8Array([1, 2, 3]), mime: 'audio/webm;codecs=opus', language: 'gu', apiKey: 'gsk_test', f: f as unknown as typeof fetch });
    expect(text).toBe('મેં આજે દાન કર્યું');
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer gsk_test');
    expect(url).not.toContain('gsk_test');
    const form = init.body as FormData;
    expect(form.get('language')).toBe('gu');
    expect(form.get('model')).toBe('whisper-large-v3');
    expect((form.get('file') as File).name).toBe('voice.webm');
  });

  it('retries once on a temporary provider error, and reports a real one without leaking more than 200 characters', async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response('busy', { status: 503 })).mockResolvedValueOnce(ok('hello'));
    expect(await transcribeAudio({ bytes: new Uint8Array([1]), mime: 'audio/mp4', language: 'en', apiKey: 'k', f: f as unknown as typeof fetch, retryDelayMs: 0 })).toBe('hello');
    expect(f).toHaveBeenCalledTimes(2);

    const bad = vi.fn().mockResolvedValue(new Response('x'.repeat(500), { status: 400 }));
    await expect(transcribeAudio({ bytes: new Uint8Array([1]), mime: 'audio/mp4', language: 'en', apiKey: 'k', f: bad as unknown as typeof fetch })).rejects.toThrow(/error 400/);
  });

  it('returns nothing for an empty clip and refuses an oversized one', async () => {
    const f = vi.fn();
    expect(await transcribeAudio({ bytes: new Uint8Array(0), mime: 'audio/webm', language: 'gu', apiKey: 'k', f: f as unknown as typeof fetch })).toBe('');
    await expect(transcribeAudio({ bytes: new Uint8Array(3_000_001), mime: 'audio/webm', language: 'gu', apiKey: 'k', f: f as unknown as typeof fetch })).rejects.toThrow('audio_too_large');
    expect(f).not.toHaveBeenCalled();
  });
});
