// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'zod';
import { corsHeaders, json } from '../_shared/cors.ts';
import { base64ToBytes, DEFAULT_TRANSCRIBE_MODEL, MAX_AUDIO_BYTES, pickTranscribeKey, transcribeAudio } from '../_shared/transcribe.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

// base64 is about a third larger than the clip itself
const Body = z.object({
  audio: z.string().min(100).max(Math.ceil(MAX_AUDIO_BYTES * 1.4)),
  mime: z.string().max(60),
  language: z.enum(['gu', 'hi', 'en']),
});

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGIN'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401, cors);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: 'bad_request' }, 400, cors);
    const { audio, mime, language } = parsed.data;

    const apiKey = pickTranscribeKey((n) => Deno.env.get(n));
    if (!apiKey) return json({ error: 'transcribe_not_configured' }, 501, cors);

    const bytes = base64ToBytes(audio);
    if (bytes.length > MAX_AUDIO_BYTES) return json({ error: 'audio_too_large' }, 413, cors);

    const text = await transcribeAudio({ bytes, mime, language, apiKey, model: Deno.env.get('TRANSCRIBE_MODEL') || DEFAULT_TRANSCRIBE_MODEL });
    return json({ text }, 200, cors);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    console.error('transcribe failed', raw);
    const message = raw.replace(/AIza[\w-]+|AQ\.[\w.-]+|sk-[\w-]+|gsk_[\w-]+/g, '[key]').slice(0, 300);
    return json({ error: 'internal_error', message }, 500, cors);
  }
});
