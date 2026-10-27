import {
  computePoints, finalize, isGrounded, MAX_POINTS, MODE_MULTIPLIER, MODES, parseAnalysis,
  type Principle, type Rubric, type TeachingIndexEntry, type UserContext,
} from '../../supabase/functions/_shared/analysis.ts';
import { AiInvalidOutput, runAnalysis } from '../../supabase/functions/_shared/pipeline.ts';
import rubric from '../../supabase/functions/_shared/rubric.v3.json';

const principles = rubric.principles as Principle[];
const index: TeachingIndexEntry[] = [{ id: 'gita-2-47', traditions: ['hindu_gita'], categories: ['seva', 'krodh', 'daan'] }];
const ctx: UserContext = { language: 'en', tradition: 'hindu_gita', goals: [] };
const range = (id: string) => principles.find((p) => p.id === id)!.range;

const item = (over: object) => ({
  summary: 'x', reason: '', principle: 'annadana', mode: 'done', evidence: 'I gave food', confidence: 0.9,
  magnitude: 2, reach: 2, intent: 3, consistency: 0, amends: 0, ...over,
});
const run = (items: object[], transcript = 'I gave food to a hungry man') => {
  const r = parseAnalysis(JSON.stringify({ actions: items, reflection: { suggestion: 's' }, safety_flag: false }));
  if (!r.ok) throw new Error(r.error);
  return finalize(r.value, ctx, index, 'seed', principles, { transcript });
};

describe('rubric v3', () => {
  it('has mental principles for thoughts, both positive and negative', () => {
    const mental = principles.filter((p) => p.mental);
    expect(mental.filter((p) => p.type === 'punya').length).toBeGreaterThanOrEqual(3);
    expect(mental.filter((p) => p.type === 'paap').length).toBeGreaterThanOrEqual(3);
    for (const p of mental) expect(p.range[1]).toBeLessThanOrEqual(25); // a state of mind never outweighs a serious deed
  });
  it('lists the same mode multipliers as the code', () => {
    for (const m of MODES) expect((rubric.modes as Record<string, { multiplier: number }>)[m].multiplier).toBe(MODE_MULTIPLIER[m]);
  });
});

describe('the points calculation', () => {
  it('is deterministic and always an integer inside 1..top of the principle range', () => {
    for (const p of principles) {
      for (const mode of MODES) {
        for (const [m, r, i, c, a] of [[0, 0, 0, 0, 0], [4, 4, 4, 2, 0], [2, 2, 2, 1, 2], [1, 3, 0, 0, 1]]) {
          const f = { magnitude: m, reach: r, intent: i, consistency: c, amends: a };
          const pts = computePoints(p.type, p.range, mode, f);
          expect(Number.isInteger(pts)).toBe(true);
          expect(pts).toBeGreaterThanOrEqual(1);
          expect(pts).toBeLessThanOrEqual(Math.min(p.range[1], MAX_POINTS));
          expect(computePoints(p.type, p.range, mode, f)).toBe(pts);
        }
      }
    }
  });

  it('gives a bigger, wider, more sincere act more points', () => {
    const r = range('annadana');
    const small = computePoints('punya', r, 'done', { magnitude: 1, reach: 1, intent: 2 });
    const big = computePoints('punya', r, 'done', { magnitude: 4, reach: 4, intent: 4, consistency: 2 });
    expect(big).toBeGreaterThan(small);
    expect(computePoints('punya', r, 'done', { magnitude: 2, reach: 2, intent: 4 })).toBeGreaterThan(computePoints('punya', r, 'done', { magnitude: 2, reach: 2, intent: 1 }));
  });

  it('counts a deed more than a plan, and a plan more than a thought', () => {
    const r = range('daana');
    const f = { magnitude: 3, reach: 3, intent: 3 };
    const done = computePoints('punya', r, 'done', f);
    const intended = computePoints('punya', r, 'intended', f);
    const thought = computePoints('punya', r, 'thought', f);
    expect(done).toBeGreaterThan(intended);
    expect(intended).toBeGreaterThan(thought);
  });

  it('weighs accidental harm far lower than deliberate harm, and amends lower paap a little', () => {
    const r = range('para_pida');
    const deliberate = computePoints('paap', r, 'done', { magnitude: 3, reach: 3, intent: 4 });
    const accident = computePoints('paap', r, 'done', { magnitude: 3, reach: 3, intent: 0 });
    expect(accident).toBeLessThan(deliberate / 2);
    const repaired = computePoints('paap', r, 'done', { magnitude: 3, reach: 3, intent: 4, amends: 2 });
    expect(repaired).toBeLessThan(deliberate);
    expect(repaired).toBeGreaterThan(0);
  });

  it('keeps an envious thought small next to a violent deed', () => {
    const envy = computePoints('paap', range('dvesha_irshya'), 'thought', { magnitude: 2, reach: 1, intent: 3 });
    const violence = computePoints('paap', range('himsa'), 'done', { magnitude: 3, reach: 2, intent: 4 });
    expect(envy).toBeLessThan(8);
    expect(violence).toBeGreaterThan(envy * 3);
  });
});

describe('finalize with the diary', () => {
  it('computes the points itself: the model has no say over the number', () => {
    const a = run([item({ weight: 50 })]);
    const b = run([item({ weight: 1 })]);
    expect(a.actions[0].weight).toBe(b.actions[0].weight);
    expect(a.actions[0].weight).toBe(computePoints('punya', range('annadana'), 'done', { magnitude: 2, reach: 2, intent: 3 }));
  });

  it('drops an item whose evidence is not in the diary, so an invented act is never scored', () => {
    const f = run([item({ evidence: 'I donated a kidney to a stranger' })], 'I gave food to a hungry man');
    expect(f.actions).toHaveLength(0);
    expect(f.dropped).toBe(1);
  });

  it('drops items the model is unsure of', () => {
    expect(run([item({ confidence: 0.3 })]).actions).toHaveLength(0);
  });

  it('keeps Gujarati and Hindi evidence, including vowel signs', () => {
    expect(isGrounded('મેં એક ભૂખ્યા માણસને જમાડ્યો', 'આજે મેં એક ભૂખ્યા માણસને જમાડ્યો.')).toBe(true);
    expect(isGrounded('मैंने गुस्से में गाली दी', 'मैंने गुस्से में अपने भाई को गाली दी।')).toBe(true);
    expect(isGrounded('I helped a stranger', 'I had lunch at the office')).toBe(false);
    expect(isGrounded('', 'anything')).toBe(false);
  });

  it('never calls a state of mind a deed: a mental principle with mode done becomes a thought and scores like one', () => {
    const f = run([item({ principle: 'dvesha_irshya', mode: 'done', evidence: 'jealous', intent: 3, magnitude: 1 })], 'I felt jealous of him');
    expect(f.actions[0].mode).toBe('thought');
    expect(f.actions[0].type).toBe('paap');
    expect(f.actions[0].weight).toBe(computePoints('paap', range('dvesha_irshya'), 'thought', { magnitude: 1, reach: 2, intent: 3 }));
  });

  it('credits holding back as merit even if the model named the paap it avoided', () => {
    const f = run([item({ principle: 'krodha', mode: 'refrained', evidence: 'walked away' })], 'I wanted to hit him but I walked away');
    expect(f.actions[0].type).toBe('punya');
    expect(f.actions[0].basis).toBe('kshama');
    expect(f.actions[0].mode).toBe('refrained');
  });

  it('turns regret into the repentance principle, as a small merit', () => {
    const f = run([item({ principle: 'para_pida', mode: 'regret', evidence: 'I regret it' })], 'I shouted and I regret it');
    expect(f.actions[0].basis).toBe('pashchattapa');
    expect(f.actions[0].type).toBe('punya');
    expect(f.actions[0].weight).toBeLessThanOrEqual(range('pashchattapa')[1]);
  });

  it('scores a deed and its repentance as two items, and a thought as less than the deed', () => {
    const text = 'I shouted at my mother and I regret it. I felt jealous of my neighbour.';
    const f = run([
      item({ principle: 'para_pida', evidence: 'I shouted at my mother', amends: 1 }),
      item({ principle: 'pashchattapa', mode: 'regret', evidence: 'I regret it' }),
      item({ principle: 'dvesha_irshya', mode: 'thought', evidence: 'I felt jealous of my neighbour' }),
    ], text);
    expect(f.actions.map((a) => a.mode)).toEqual(['done', 'regret', 'thought']);
    expect(f.actions.map((a) => a.type)).toEqual(['paap', 'punya', 'paap']);
    expect(f.actions[0].weight).toBeGreaterThan(f.actions[2].weight);
  });

  it('takes the sign and category from the principle, so type and category cannot contradict it', () => {
    const f = run([item({ principle: 'asatya', evidence: 'I lied' })], 'I lied to my boss');
    expect(f.actions[0]).toMatchObject({ type: 'paap', category: 'satya', basis: 'asatya' });
  });
});

describe('the pipeline', () => {
  const reply = (actions: object[]) =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ actions, reflection: { suggestion: 's' }, safety_flag: false }) } }] }), { status: 200 });
  const configs = [{ provider: 'groq' as const, model: 'm', apiKey: 'k' }];
  const base = { ctx, rubric: rubric as unknown as Rubric, index, configs, seed: 's', retryDelayMs: 1 };

  it('never sends crisis text to the AI', async () => {
    const f = vi.fn();
    const out = await runAnalysis({ ...base, transcript: 'I want to die', f: f as unknown as typeof fetch });
    expect(out.safety).toBe(true);
    expect(f).not.toHaveBeenCalled();
  });

  it('asks once more when none of the items match the diary, then uses the grounded answer', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(reply([item({ evidence: 'something I never wrote' })]))
      .mockResolvedValueOnce(reply([item({ evidence: 'I gave food' })]));
    const out = await runAnalysis({ ...base, transcript: 'I gave food to a hungry man', f: f as unknown as typeof fetch });
    if (out.safety) throw new Error('unexpected safety');
    expect(f).toHaveBeenCalledTimes(2);
    expect(out.final.actions).toHaveLength(1);
  });

  it('retries once on invalid JSON and then gives up with a clear error', async () => {
    const bad = () => new Response(JSON.stringify({ choices: [{ message: { content: 'nope' } }] }), { status: 200 });
    const f = vi.fn().mockImplementation(async () => bad());
    await expect(runAnalysis({ ...base, transcript: 'I gave food', f: f as unknown as typeof fetch })).rejects.toBeInstanceOf(AiInvalidOutput);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
