/**
 * DEV ONLY. Lets the app run fully on your machine with real AI and no Supabase function:
 * POST /dev-api/analyze runs the same scoring pipeline as the `analyze-day` Edge Function
 * (safety gate, prompt, provider call + fallback, zod validation, post-processing).
 *
 * Keys come from .env.local (AI_PROVIDER, AI_API_KEY, ...). They are NOT VITE_-prefixed,
 * so Vite never bundles them into the browser. This plugin is not part of the production build.
 */
import { readFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';
import {
  buildSystemPrompt, buildUserPrompt, detectSafety, finalize, parseAnalysis,
  type Rubric, type TeachingIndexEntry, type UserContext,
} from './supabase/functions/_shared/analysis.ts';
import { callWithFallback, readAiConfigs } from './supabase/functions/_shared/providers.ts';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 20_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function devAi(env: Record<string, string>): Plugin {
  return {
    name: 'karma-dev-ai',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/dev-api/analyze', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
        try {
          const body = JSON.parse(await readBody(req)) as { transcript?: string; date?: string; language?: UserContext['language']; tradition?: UserContext['tradition']; goals?: string[] };
          const transcript = (body.transcript ?? '').trim().slice(0, 4000);
          if (!transcript) return send(400, { error: 'bad_request' });
          const ctx: UserContext = { language: body.language ?? 'en', tradition: body.tradition ?? 'general', goals: body.goals ?? [] };

          if (detectSafety(transcript)) return send(200, { safety_flag: true, actions: [], reflection: { teaching_id: '', suggestion: '' } });

          let configs;
          try {
            configs = readAiConfigs((n) => env[n]);
          } catch (e) {
            return send(501, { error: 'ai_not_configured', message: e instanceof Error ? e.message : '' });
          }
          const rubric = JSON.parse(readFileSync('supabase/functions/_shared/rubric.v1.json', 'utf8')) as Rubric;
          const index = JSON.parse(readFileSync('supabase/functions/_shared/teachings.index.json', 'utf8')) as TeachingIndexEntry[];
          const system = buildSystemPrompt(rubric, index, ctx);

          let out = await callWithFallback(configs, system, buildUserPrompt(transcript));
          let parsed = parseAnalysis(out.text);
          if (!parsed.ok) {
            out = await callWithFallback(configs, system, `${buildUserPrompt(transcript)}\n\nYour previous reply was invalid (${parsed.error}). Reply again with ONLY the JSON object in the exact shape.`);
            parsed = parseAnalysis(out.text);
          }
          if (!parsed.ok) return send(502, { error: 'ai_invalid_output', message: parsed.error.slice(0, 200) });
          if (parsed.value.safety_flag) return send(200, { safety_flag: true, actions: [], reflection: { teaching_id: '', suggestion: '' } });

          const final = finalize(parsed.value, ctx, index, `${body.date ?? ''}:${transcript}`);
          return send(200, { safety_flag: false, actions: final.actions.map((a) => ({ ...a })), reflection: final.reflection, provider: out.cfg.provider, model: out.cfg.model });
        } catch (e) {
          const raw = e instanceof Error ? e.message : String(e);
          const message = raw.replace(/gsk_[\w-]+|AIza[\w-]+|AQ\.[\w.-]+|sk-[\w-]+/g, '[key]').slice(0, 300);
          console.error('[dev-ai]', message);
          return send(500, { error: 'internal_error', message });
        }
      });
    },
  };
}
