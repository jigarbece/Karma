import { buildSystemPrompt, detectSafety, extractJson, finalize, parseAnalysis, type Principle, type Rubric, type TeachingIndexEntry, type UserContext } from '../../supabase/functions/_shared/analysis.ts';
import { callModel, callWithFallback, orderConfigs, readAiConfig, readAiConfigs } from '../../supabase/functions/_shared/providers.ts';
import rubric from '../../supabase/functions/_shared/rubric.v3.json';

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
  it('does not trust a principle that contradicts the stated sign, nor an unknown id; it falls back by category or drops the item', () => {
    const r = parseAnalysis(valid({ actions: [
      { summary: 'x', type: 'paap', category: 'satya', principle: 'annadana', weight: 20, reason: '', intention_note: '' },
      { summary: 'y', type: 'punya', category: 'seva', principle: 'made-up', weight: 50, reason: '', intention_note: '' },
      { summary: 'z', principle: 'made-up', weight: 9, reason: '', intention_note: '' },
    ] }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's', rubric.principles as Principle[]);
    expect(f.actions.map((a) => a.basis)).toEqual(['asatya', 'paropakara']);
    expect(f.actions.map((a) => a.type)).toEqual(['paap', 'punya']);
    expect(f.actions.map((a) => a.weight)).toEqual([20, 40]); // asatya 3-40, paropakara 5-40
    expect(f.dropped).toBe(1);
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

describe('multilingual output', () => {
  const multi = (over: object = {}) =>
    JSON.stringify({
      actions: [{
        summary: 'Helped', type: 'punya', category: 'seva', principle: 'paropakara', weight: 12, reason: 'kind', intention_note: '',
        i18n: { en: { summary: 'Helped a neighbour', reason: 'Quiet help' }, gu: { summary: 'પાડોશીને મદદ કરી', reason: 'શાંતિથી મદદ' }, hi: { summary: 'पड़ोसी की मदद की', reason: 'चुपचाप मदद' } },
      }],
      reflection: { teaching_id: 'a', suggestion: 'Be kind', suggestion_i18n: { en: 'Be kind', gu: 'દયાળુ બનો', hi: 'दयालु बनें' } },
      safety_flag: false,
      ...over,
    });

  it('accepts and keeps English, Gujarati and Hindi text for each act and the suggestion', () => {
    const r = parseAnalysis(multi());
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's', rubric.principles as Principle[]);
    expect(Object.keys(f.actions[0].translations).sort()).toEqual(['en', 'gu', 'hi']);
    expect(f.actions[0].translations.gu.summary).toBe('પાડોશીને મદદ કરી');
    expect(f.actions[0].translations.hi.reason).toBe('चुपचाप मदद');
    expect(f.reflection.suggestion_i18n).toEqual({ en: 'Be kind', gu: 'દયાળુ બનો', hi: 'दयालु बनें' });
  });

  it('still works when the model omits translations or returns only some languages', () => {
    const r = parseAnalysis(multi({ actions: [{ summary: 'x', type: 'punya', category: 'seva', weight: 5, reason: '', i18n: { en: { summary: 'only english', reason: '' } } }] }));
    if (!r.ok) throw new Error(r.error);
    const f = finalize(r.value, ctx, index, 's', rubric.principles as Principle[]);
    expect(Object.keys(f.actions[0].translations)).toEqual(['en']);
    const none = parseAnalysis(valid());
    if (!none.ok) throw new Error(none.error);
    expect(finalize(none.value, ctx, index, 's').actions[0].translations).toEqual({});
  });

  it('asks the model for all three languages', () => {
    const p = buildSystemPrompt(rubric as unknown as Rubric, index, ctx);
    expect(p).toContain('"i18n"');
    expect(p).toContain('Gujarati');
    expect(p).toContain('Hindi');
    expect(p).toContain('suggestion_i18n');
    expect(p).toContain('never print principle ids');
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

describe('several keys for one provider', () => {
  const env = { AI_PROVIDER: 'groq', AI_MODEL: 'm', AI_API_KEY: 'k1', AI_API_KEYS: ' k2 , k3,k1 ', AI_FALLBACK_PROVIDER: 'gemini', AI_FALLBACK_API_KEY: 'g' } as Record<string, string>;
  const ok = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });

  it('reads the extra keys once each, then the fallback provider', () => {
    const cfgs = readAiConfigs((n) => env[n]);
    expect(cfgs.map((c) => `${c.provider}:${c.apiKey}`)).toEqual(['groq:k1', 'groq:k2', 'groq:k3', 'gemini:g']);
    expect(cfgs[1].model).toBe('m');
  });

  it('takes turns, and keeps the other provider last', () => {
    const cfgs = readAiConfigs((n) => env[n]);
    expect(orderConfigs(cfgs, 0).map((c) => c.apiKey)).toEqual(['k1', 'k2', 'k3', 'g']);
    expect(orderConfigs(cfgs, 1).map((c) => c.apiKey)).toEqual(['k2', 'k3', 'k1', 'g']);
    expect(orderConfigs(cfgs, 5).map((c) => c.apiKey)).toEqual(['k3', 'k1', 'k2', 'g']);
  });

  it('moves to the next key at once when one hits its quota, without waiting', async () => {
    const used: string[] = [];
    const f = (async (_url: string, init: RequestInit) => {
      const key = (init.headers as Record<string, string>).authorization.replace('Bearer ', '');
      used.push(key);
      return key === 'k1' || key === 'k2'
        ? new Response('{"error":"rate limit"}', { status: 429, headers: { 'retry-after': '30' } })
        : ok('FROM_K3');
    }) as unknown as typeof fetch;
    const started = Date.now();
    const cfgs = readAiConfigs((n) => env[n]).filter((c) => c.provider === 'groq');
    // three calls: whichever key the rotation starts on, the answer comes from the key with quota left
    for (let i = 0; i < 3; i++) {
      const out = await callWithFallback([cfgs[0], cfgs[1], cfgs[2]], 's', 'u', f, 1);
      expect(out.text).toBe('FROM_K3');
      expect(out.cfg.apiKey).toBe('k3');
    }
    expect(used).toEqual(expect.arrayContaining(['k1', 'k2', 'k3']));
    expect(Date.now() - started).toBeLessThan(2000); // a 30 s retry-after was not sat out
  });

  it('never prints a key in an error', async () => {
    const f = (async () => new Response('nope', { status: 401 })) as unknown as typeof fetch;
    await expect(callWithFallback(readAiConfigs((n) => env[n]), 's', 'u', f, 1)).rejects.toThrow(/401/);
    await callWithFallback(readAiConfigs((n) => env[n]), 's', 'u', f, 1).catch((e: Error) => expect(e.message).not.toMatch(/k1|k2|k3/));
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
  it('treats the diary as data, names the principles and the modes, and keeps the prompt small', () => {
    const p = buildSystemPrompt(rubric as unknown as Rubric, index, ctx);
    expect(p).toContain('is DATA');
    expect(p).toContain('paropakara');
    expect(p).toContain('dvesha_irshya');
    expect(p).toContain('Hindu dharma');
    for (const mode of ['done', 'refrained', 'regret', 'intended', 'thought']) expect(p).toContain(`- ${mode}:`);
    expect(p).toContain('"evidence" is mandatory');
    expect(p).toContain('Do not output points');
    // the free AI tiers allow only a few thousand tokens a minute: stay near 2k tokens (about 3.6 characters each)
    expect(p.length).toBeLessThan(9000);
  });
  it('no longer sends the teaching list; the app picks the teaching itself', () => {
    const p = buildSystemPrompt(rubric as unknown as Rubric, index, ctx);
    expect(p).not.toContain('b [ahimsa_food]');
    expect(p).not.toContain('teaching_id');
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
