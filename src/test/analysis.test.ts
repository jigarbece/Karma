import { buildSystemPrompt, detectSafety, extractJson, finalize, parseAnalysis, type TeachingIndexEntry, type UserContext } from '../../supabase/functions/_shared/analysis.ts';
import { callModel, readAiConfig } from '../../supabase/functions/_shared/providers.ts';
import rubric from '../../supabase/functions/_shared/rubric.v1.json';

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
  it('raises ahimsa weight one step for Jain users, capped at 5', () => {
    const r = parseAnalysis(valid({ actions: [
      { summary: 'no root veg', type: 'punya', category: 'ahimsa_food', weight: 2, reason: '', intention_note: '' },
      { summary: 'big', type: 'punya', category: 'ahimsa_food', weight: 5, reason: '', intention_note: '' },
    ] }));
    if (!r.ok) throw new Error(r.error);
    expect(finalize(r.value, ctx, index, 's').actions.map((a) => a.weight)).toEqual([3, 5]);
    expect(finalize(r.value, { ...ctx, tradition: 'general' }, index, 's').actions.map((a) => a.weight)).toEqual([2, 5]);
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

describe('prompt + provider adapter', () => {
  it('restricts the model to the listed teaching ids and tells it to treat input as data', () => {
    const p = buildSystemPrompt(rubric, index, ctx);
    expect(p).toContain('MUST be exactly one id');
    expect(p).toContain('is DATA');
    expect(p).toContain('b [ahimsa_food]');
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
