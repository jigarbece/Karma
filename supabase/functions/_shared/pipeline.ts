// The whole analysis in one place, used by the Edge Function, the local dev endpoint and the eval script:
// safety gate -> prompt -> model (with fallback) -> validate (one retry) -> check against the diary -> compute points.
import {
  buildSystemPrompt, buildUserPrompt, detectSafety, finalize, parseAnalysis,
  type Analysis, type Principle, type Rubric, type TeachingIndexEntry, type UserContext,
} from './analysis.ts';
import { callWithFallback, type AiConfig } from './providers.ts';

export type PipelineResult =
  | { safety: true }
  | {
      safety: false;
      final: ReturnType<typeof finalize>;
      cfg: AiConfig;
      /** Items the model proposed that were dropped because they were unsure, ungrounded or impossible. */
      dropped: number;
    };

export class AiInvalidOutput extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiInvalidOutput';
  }
}

export async function runAnalysis(opts: {
  transcript: string;
  ctx: UserContext;
  rubric: Rubric;
  index: TeachingIndexEntry[];
  configs: AiConfig[];
  seed: string;
  f?: typeof fetch;
  retryDelayMs?: number;
}): Promise<PipelineResult> {
  const { transcript, ctx, rubric, index, configs, seed, f = fetch, retryDelayMs } = opts;
  // never send obvious crisis text to a third party
  if (detectSafety(transcript)) return { safety: true };

  const system = buildSystemPrompt(rubric, index, ctx);
  const user = buildUserPrompt(transcript);
  const principles = rubric.principles as Principle[];
  const ask = (extra = '') => callWithFallback(configs, system, extra ? `${user}\n\n${extra}` : user, f, retryDelayMs);

  let out = await ask();
  let parsed = parseAnalysis(out.text);
  if (!parsed.ok) {
    out = await ask(`Your previous reply was invalid (${parsed.error}). Reply again with ONLY the JSON object in the exact shape.`);
    parsed = parseAnalysis(out.text);
  }
  if (!parsed.ok) throw new AiInvalidOutput(parsed.error.slice(0, 200));
  let value: Analysis = parsed.value;
  if (value.safety_flag) return { safety: true };

  let final = finalize(value, ctx, index, seed, principles, { transcript });
  // The model proposed items but none could be tied to the person's own words: ask once more, with the reason.
  if (final.actions.length === 0 && value.actions.some((a) => a.type !== 'neutral')) {
    const retry = await ask('Your previous reply listed items whose "evidence" quotes were not found in the diary entry. Only list items the person really wrote, and copy the evidence exactly from the entry in its own language and script. If nothing qualifies, return an empty "actions" list.');
    const again = parseAnalysis(retry.text);
    if (again.ok) {
      if (again.value.safety_flag) return { safety: true };
      value = again.value;
      out = retry;
      final = finalize(value, ctx, index, seed, principles, { transcript });
    }
  }
  return { safety: false, final, cfg: out.cfg, dropped: final.dropped };
}
