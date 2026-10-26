// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'zod';
import rubric from '../_shared/rubric.v1.json' with { type: 'json' };
import teachingIndex from '../_shared/teachings.index.json' with { type: 'json' };
import { buildSystemPrompt, buildUserPrompt, detectSafety, finalize, localDateIn, parseAnalysis, type TeachingIndexEntry } from '../_shared/analysis.ts';
import { callWithFallback, readAiConfigs } from '../_shared/providers.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

const Body = z.object({
  transcript: z.string().trim().min(1).max(4000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  language: z.enum(['gu', 'hi', 'en']),
});

const LIMIT = Number(Deno.env.get('DAILY_ANALYSIS_LIMIT') ?? 10);

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGIN'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401, cors);
    const userId = userData.user.id;

    const parsedBody = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) return json({ error: 'bad_request' }, 400, cors);
    const { transcript, date, language } = parsedBody.data;

    const { data: profile } = await supabase
      .from('profiles').select('tradition, goals, timezone, keep_words, consent_at').eq('id', userId).maybeSingle();
    if (!profile?.consent_at) return json({ error: 'consent_required' }, 403, cors);

    // Safety first: never score, never send obvious crisis text to a third party.
    if (detectSafety(transcript)) return json({ safety_flag: true, actions: [], reflection: null, entry: null }, 200, cors);

    // Rate limit per user per local day
    const today = localDateIn(profile.timezone ?? 'Asia/Kolkata');
    const { count } = await supabase
      .from('analysis_log').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('local_date', today);
    if ((count ?? 0) >= LIMIT) return json({ error: 'rate_limited', limit: LIMIT }, 429, cors);
    await supabase.from('analysis_log').insert({ user_id: userId, local_date: today });

    const ctx = { language, tradition: profile.tradition, goals: profile.goals ?? [] } as const;
    const index = teachingIndex as TeachingIndexEntry[];
    const configs = readAiConfigs((n) => Deno.env.get(n));
    const system = buildSystemPrompt(rubric as any, index, ctx as any);

    const first = await callWithFallback(configs, system, buildUserPrompt(transcript));
    let cfg = first.cfg;
    let result = parseAnalysis(first.text);
    if (!result.ok) {
      const retryUser = `${buildUserPrompt(transcript)}\n\nYour previous reply was invalid (${result.error}). Reply again with ONLY the JSON object in the exact shape.`;
      const second = await callWithFallback(configs, system, retryUser);
      cfg = second.cfg;
      result = parseAnalysis(second.text);
    }
    if (!result.ok) return json({ error: 'ai_invalid_output' }, 502, cors);
    if (result.value.safety_flag) return json({ safety_flag: true, actions: [], reflection: null, entry: null }, 200, cors);

    const final = finalize(result.value, ctx as any, index, `${date}:${userId}`);

    const { data: entry, error: entryErr } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        entry_date: date,
        transcript: profile.keep_words ? transcript : null,
        language,
        ai_provider: cfg.provider,
        ai_model: cfg.model,
        rubric_version: rubric.version,
      })
      .select('*').single();
    if (entryErr) throw entryErr;

    let actions: any[] = [];
    if (final.actions.length) {
      const { data, error } = await supabase
        .from('actions')
        .insert(final.actions.map((a) => ({ ...a, user_id: userId, entry_id: entry.id, entry_date: date })))
        .select('*');
      if (error) throw error;
      actions = data;
    }
    await supabase.from('reflections').insert({ user_id: userId, date, teaching_id: final.reflection.teaching_id, suggestion: final.reflection.suggestion });

    return json({ safety_flag: false, entry, actions, reflection: final.reflection }, 200, cors);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    console.error('analyze-day failed', raw);
    // Surface a short, key-free reason so the app can show what went wrong.
    const message = raw.replace(/AIza[\w-]+|AQ\.[\w.-]+|sk-[\w-]+|gsk_[\w-]+/g, '[key]').slice(0, 300);
    return json({ error: 'internal_error', message }, 500, cors);
  }
});
