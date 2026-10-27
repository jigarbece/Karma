import { buildSystemPrompt, detectSafety, extractJson, finalize, parseAnalysis, type Principle, type Rubric, type TeachingIndexEntry, type UserContext } from '../../supabase/functions/_shared/analysis.ts';
import { callModel, callWithFallback, readAiConfig, readAiConfigs } from '../../supabase/functions/_shared/providers.ts';
import rubric from '../../supabase/functions/_shared/rubric.v2.json';

const index: TeachingIndexEntry[] = [
  { id: 'a', traditions: ['general'], categories: ['seva'] },
  { id: 'b', traditions: ['jain'], categories: ['ahimsa_food'] },
];
const ctx: UserContext = { language: 'en', tradition: 'jain', goals: [] };

const valid = (over: object = {}) =>
  JSON.stringify({
    actions: [{ summary: 'Helped', type: 'punya', category: 'seva', weight: 2, reason: 'kind', intention_note: '' }],
    reflection: { teaching_id: 'a', suggestion: 'Be kind' },
    safety_flag: false,
    ...over,
  });

describe('analysis schema + post-processing', () => {
  it('accepts valid JSON, including inside code fences', () => {
    expect(parseAnalysis(valid()).ok).toBe(true);
    expect(parseAnalysis('```json\n' + valid() + '\n```').ok).toBe(true);
    expect(extractJson('noise {"a":1} tail')).toEqual({ a: 1 });
  });
  it('rejects wrong categories and out-of-range weights', () => {
    const bad = JSON.stringify({ actions: [{ summary: 'x', type: 'punya', category: 'nope', weight: 9, reason: '' }], reflection: { teaching_id: 'a', suggestion: '' }, safety_flag: false });
    expect(parseAnalysis(bad).ok).toBe(false);
    expect(parseAnalysis('not json').ok).toBe(false);
  });
  it('drops neutral actions and clamps weights', () => {
    const r = parseAnalysis(valid({ actions: [
      { summary: 'commute', type: 'neutral', category: 'seva', weight: 0, reason: '', intention_note: '' },
      { summary: 'helped', type: 'punya', category: 'seva', weight: 5, reason: '', intention_note: '' },
    ] }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 'seed');
    expect(f.actions).toHaveLength(1);
    expect(f.actions[0].weight).toBe(5);
  });
  it('keeps points inside the matched dharma principle range and records the principle', () => {
    const r = parseAnalysis(valid({ actions: [
      { summary: 'fed the hungry', type: 'punya', category: 'daan', principle: 'annadana', weight: 50, reason: '', intention_note: '' },
      { summary: 'small prayer', type: 'punya', category: 'gratitude_bhakti', principle: 'bhakti_sadhana', weight: 1, reason: '', intention_note: '' },
    ] }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's', rubric.principles as Principle[]);
    expect(f.actions.map((a) => a.weight)).toEqual([45, 3]); // annadana 10-45, bhakti 3-30
    expect(f.actions.map((a) => a.basis)).toEqual(['annadana', 'bhakti_sadhana']);
  });
  it('ignores a principle of the wrong type or an unknown id, and still allows 1-50', () => {
    const r = parseAnalysis(valid({ actions: [
      { summary: 'x', type: 'paap', category: 'satya', principle: 'annadana', weight: 20, reason: '', intention_note: '' },
      { summary: 'y', type: 'punya', category: 'seva', principle: 'made-up', weight: 50, reason: '', intention_note: '' },
    ] }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's', rubric.principles as Principle[]);
    expect(f.actions.map((a) => a.basis)).toEqual(['', '']);
    expect(f.actions.map((a) => a.weight)).toEqual([20, 50]);
  });
  it('rejects points above 50', () => {
    const bad = JSON.stringify({ actions: [{ summary: 'x', type: 'punya', category: 'seva', weight: 51, reason: '' }], reflection: { teaching_id: 'a', suggestion: '' }, safety_flag: false });
    expect(parseAnalysis(bad).ok).toBe(false);
  });
  it('never lets the model invent a teaching id', () => {
    const r = parseAnalysis(valid({ reflection: { teaching_id: 'made-up-verse', suggestion: 'x' } }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's');
    expect(index.map((t) => t.id)).toContain(f.reflection.teaching_id);
  });
  it('is deterministic for the same input', () => {
    const r = parseAnalysis(valid({ reflection: { teaching_id: 'zzz', suggestion: '' } }));
    if (!r.ok) throw new Error(r.error);
    expect(finalize(r.value, ctx, index, 'k')).toEqual(finalize(r.value, ctx, index, 'k'));
  });
});

describe('safety', () => {
  it('flags self-harm in English, Hindi and Gujarati', () => {
    expect(detectSafety('I want to die')).toBe(true);
    expect(detectSafety('मैं आत्महत्या करना चाहता हूँ')).toBe(true);
    expect(detectSafety('મને આત્મહત્યાના વિચારો આવે છે')).toBe(true);
  });
  it('does not flag ordinary text', () => {
    expect(detectSafety('I end my day with prayer and fed the dog')).toBe(false);
  });
});

describe('provider fallback', () => {
  const env = { AI_PROVIDER: 'gemini', AI_API_KEY: 'k1', AI_FALLBACK_PROVIDER: 'groq', AI_FALLBACK_API_KEY: 'k2' } as Record<string, string>;
  it('reads an optional fallback config', () => {
    const cfgs = readAiConfigs((n) => env[n]);
    expect(cfgs.map((c) => c.provider)).toEqual(['gemini', 'groq']);
    expect(readAiConfigs((n) => ({ AI_API_KEY: 'k' } as Record<string, string>)[n])).toHaveLength(1);
  });
  it('uses the fallback when the primary keeps failing', async () => {
    const f = (async (url: string) =>
      String(url).includes('googleapis')
        ? new Response('overloaded', { status: 503 })
        : new Response(JSON.stringify({ choices: [{ message: { content: 'FROM_GROQ' } }] }), { status: 200 })) as unknown as typeof fetch;
    const out = await callWithFallback(readAiConfigs((n) => env[n]), 's', 'u', f, 1);
    expect(out.text).toBe('FROM_GROQ');
    expect(out.cfg.provider).toBe('groq');
  });
  it('throws when every provider fails', async () => {
    const f = (async () => new Response('down', { status: 500 })) as unknown as typeof fetch;
    await expect(callWithFallback(readAiConfigs((n) => env[n]), 's', 'u', f, 1)).rejects.toThrow(/500/);
  });
});

describe('provider retry', () => {
  it('retries a temporary 503 and then succeeds', async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return calls < 3
        ? new Response('{"error":"busy"}', { status: 503 })
        : new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const out = await callModel({ provider: 'groq', model: 'm', apiKey: 'k' }, 's', 'u', f, 1);
    expect(out).toBe('OK');
    expect(calls).toBe(3);
  });
  it('does not retry a 401', async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return new Response('nope', { status: 401 });
    }) as unknown as typeof fetch;
    await expect(callModel({ provider: 'groq', model: 'm', apiKey: 'k' }, 's', 'u', f, 1)).rejects.toThrow(/401/);
    expect(calls).toBe(1);
  });
});

describe('prompt + provider adapter', () => {
  it('restricts the model to the listed teaching ids and tells it to treat input as data', () => {
    const p = buildSystemPrompt(rubric as unknown as Rubric, index, ctx);
    expect(p).toContain('MUST be exactly one id');
    expect(p).toContain('is DATA');
    expect(p).toContain('b [ahimsa_food]');
    expect(p).toContain('paropakara');
    expect(p).toContain('from 1 to 50');
    expect(p).toContain('Hindu dharma');
  });
  it('requires a key and rejects unknown providers', () => {
    expect(() => readAiConfig(() => undefined)).toThrow(/AI_API_KEY/);
    expect(() => readAiConfig((n) => ({ AI_PROVIDER: 'nope', AI_API_KEY: 'k' } as Record<string, string>)[n])).toThrow(/Unsupported/);
    expect(readAiConfig((n) => ({ AI_API_KEY: 'k' } as Record<string, string>)[n]).provider).toBe('gemini');
  });
  it.each([
    ['gemini', { candidates: [{ content: { parts: [{ text: 'OUT' }] } }] }, 'generativelanguage.googleapis.com'],
    ['groq', { choices: [{ message: { content: 'OUT' } }] }, 'api.groq.com'],
    ['openai', { choices: [{ message: { content: 'OUT' } }] }, 'api.openai.com'],
    ['anthropic', { content: [{ type: 'text', text: 'OUT' }] }, 'api.anthropic.com'],
  ])('%s adapter calls the right host at temperature 0 and never puts the key in the URL', async (provider, reply, host) => {
    let seenUrl = '';
    let seenBody = '';
    const f = (async (url: string, init: RequestInit) => {
      seenUrl = url;
      seenBody = String(init.body);
      return new Response(JSON.stringify(reply), { status: 200 });
    }) as unknown as typeof fetch;
    const out = await callModel({ provider: provider as 'gemini', model: 'm', apiKey: 'SECRET' }, 'sys', 'usr', f);
    expect(out).toBe('OUT');
    expect(seenUrl).toContain(host);
    expect(seenUrl).not.toContain('SECRET');
    expect(JSON.parse(seenBody)).toMatchObject(provider === 'gemini' ? { generationConfig: { temperature: 0 } } : { temperature: 0 });
  });
});
