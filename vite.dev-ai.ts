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
import { detectSafety, type Rubric, type TeachingIndexEntry, type UserContext } from './supabase/functions/_shared/analysis.ts';
import { AiInvalidOutput, runAnalysis } from './supabase/functions/_shared/pipeline.ts';
import { readAiConfigs } from './supabase/functions/_shared/providers.ts';
import { base64ToBytes, DEFAULT_TRANSCRIBE_MODEL, MAX_AUDIO_BYTES, pickTranscribeKeys, transcribeAudio } from './supabase/functions/_shared/transcribe.ts';

function readBody(req: IncomingMessage, max = 20_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > max) reject(new Error('body too large'));
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
      // voice to text for Gujarati and other languages the browser cannot do itself (same code as the `transcribe` function)
      server.middlewares.use('/dev-api/transcribe', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
        try {
          const body = JSON.parse(await readBody(req, Math.ceil(MAX_AUDIO_BYTES * 1.4) + 1000)) as { audio?: string; mime?: string; language?: 'gu' | 'hi' | 'en' };
          const apiKey = pickTranscribeKeys((n) => env[n]);
          if (apiKey.length === 0) return send(501, { error: 'transcribe_not_configured' });
          if (!body.audio || !body.language) return send(400, { error: 'bad_request' });
          const text = await transcribeAudio({
            bytes: base64ToBytes(body.audio), mime: body.mime ?? 'audio/webm', language: body.language, apiKey,
            model: env.TRANSCRIBE_MODEL || DEFAULT_TRANSCRIBE_MODEL,
          });
          return send(200, { text });
        } catch (e) {
          const raw = e instanceof Error ? e.message : String(e);
          const message = raw.replace(/gsk_[\w-]+|AIza[\w-]+|AQ\.[\w.-]+|sk-[\w-]+/g, '[key]').slice(0, 300);
          console.error('[dev-transcribe]', message);
          return send(500, { error: 'internal_error', message });
        }
      });

      server.middlewares.use('/dev-api/analyze', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
        try {
          const body = JSON.parse(await readBody(req)) as { transcript?: string; date?: string; language?: UserContext['language'] };
          const transcript = (body.transcript ?? '').trim().slice(0, 4000);
          if (!transcript) return send(400, { error: 'bad_request' });
          // Scoring is grounded in Hindu dharma (rubric v3) for every user.
          const ctx: UserContext = { language: body.language ?? 'en', tradition: 'hindu_gita', goals: [] };
          const safe = () => send(200, { safety_flag: true, actions: [], reflection: { teaching_id: '', suggestion: '' } });
          if (detectSafety(transcript)) return safe();

          let configs;
          try {
            configs = readAiConfigs((n) => env[n]);
          } catch (e) {
            return send(501, { error: 'ai_not_configured', message: e instanceof Error ? e.message : '' });
          }
          const rubric = JSON.parse(readFileSync('supabase/functions/_shared/rubric.v3.json', 'utf8')) as Rubric;
          const index = JSON.parse(readFileSync('supabase/functions/_shared/teachings.index.json', 'utf8')) as TeachingIndexEntry[];

          let outcome;
          try {
            outcome = await runAnalysis({ transcript, ctx, rubric, index, configs, seed: `${body.date ?? ''}:${transcript}` });
          } catch (e) {
            if (e instanceof AiInvalidOutput) return send(502, { error: 'ai_invalid_output', message: e.message });
            throw e;
          }
          if (outcome.safety) return safe();
          const { final, cfg, dropped } = outcome;
          return send(200, { safety_flag: false, actions: final.actions.map((a) => ({ ...a })), reflection: final.reflection, provider: cfg.provider, model: cfg.model, dropped });
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
