// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'zod';
import rubric from '../_shared/rubric.v3.json' with { type: 'json' };
import teachingIndex from '../_shared/teachings.index.json' with { type: 'json' };
import { detectSafety, localDateIn, type TeachingIndexEntry } from '../_shared/analysis.ts';
import { AiInvalidOutput, runAnalysis } from '../_shared/pipeline.ts';
import { readAiConfigs } from '../_shared/providers.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { encryptText } from '../_shared/crypto.ts';

declare const Deno: { env: { get(name: string): string | undefined }; serve(h: (req: Request) => Response | Promise<Response>): void };

const Body = z.object({
  transcript: z.string().trim().min(1).max(4000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  language: z.enum(['gu', 'hi', 'en']),
});

// 0 (the default) means unlimited; set DAILY_ANALYSIS_LIMIT to a number to cap analyses per user per day
const LIMIT = Number(Deno.env.get('DAILY_ANALYSIS_LIMIT') ?? 0);

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
    if (LIMIT > 0 && (count ?? 0) >= LIMIT) return json({ error: 'rate_limited', limit: LIMIT }, 429, cors);
    await supabase.from('analysis_log').insert({ user_id: userId, local_date: today });

    // Scoring is grounded in Hindu dharma (rubric v3) for every user: the model describes each deed or thought,
    // this code checks it against what was written and computes the points.
    const ctx = { language, tradition: 'hindu_gita', goals: [] as string[] } as const;
    const index = teachingIndex as TeachingIndexEntry[];
    let outcome;
    try {
      outcome = await runAnalysis({
        transcript, ctx: ctx as any, rubric: rubric as any, index, seed: `${date}:${userId}`,
        configs: readAiConfigs((n) => Deno.env.get(n)),
      });
    } catch (e) {
      if (e instanceof AiInvalidOutput) return json({ error: 'ai_invalid_output' }, 502, cors);
      throw e;
    }
    if (outcome.safety) return json({ safety_flag: true, actions: [], reflection: null, entry: null }, 200, cors);
    const { final, cfg } = outcome;

    // The message is stored only encrypted (AES-256-GCM, key in the TRANSCRIPT_KEY secret) and is never shown
    // in the app. Without a key we store nothing rather than store plain text.
    const transcriptKey = Deno.env.get('TRANSCRIPT_KEY');
    const sealed = profile.keep_words && transcriptKey ? await encryptText(transcript, transcriptKey) : null;

    const { data: entry, error: entryErr } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        entry_date: date,
        transcript: sealed,
        language,
        ai_provider: cfg.provider,
        ai_model: cfg.model,
        rubric_version: rubric.version,
      })
      .select('*').single();
    if (entryErr) throw entryErr;

    let actions: any[] = [];
    if (final.actions.length) {
      const rows = final.actions.map((a) => ({ ...a, user_id: userId, entry_id: entry.id, entry_date: date }));
      let { data, error } = await supabase.from('actions').insert(rows).select('*');
      // the `mode` column comes from the 20261028 migration; until it is applied, save without it rather than fail
      if (error && /'mode' column|column "?mode"?/i.test(error.message)) {
        ({ data, error } = await supabase.from('actions').insert(rows.map(({ mode: _mode, ...rest }) => rest)).select('*'));
      }
      if (error) throw error;
      actions = data ?? [];
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
