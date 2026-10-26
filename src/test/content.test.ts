import { readFileSync } from 'node:fs';
import en from '../i18n/en.json';
import gu from '../i18n/gu.json';
import hi from '../i18n/hi.json';
import { TEACHINGS } from '../lib/teachings';
import { CATEGORIES } from '../lib/types';
import rubric from '../../supabase/functions/_shared/rubric.v1.json';

describe('teachings', () => {
  it('has 40+ entries with unique ids and all three languages', () => {
    expect(TEACHINGS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(TEACHINGS.map((t) => t.id)).size).toBe(TEACHINGS.length);
    for (const t of TEACHINGS) {
      expect(t.source.length).toBeGreaterThan(3);
      for (const l of ['gu', 'hi', 'en'] as const) expect(t.text[l].length).toBeGreaterThan(10);
      // short paraphrases only, never long quotations
      expect(t.text.en.length).toBeLessThan(260);
      for (const c of t.categories) expect(CATEGORIES).toContain(c);
    }
  });
  it('keeps the Edge Function teaching index in sync (run npm run sync:shared)', () => {
    const idx = JSON.parse(readFileSync('supabase/functions/_shared/teachings.index.json', 'utf8')) as Array<{ id: string }>;
    expect(idx.map((x) => x.id)).toEqual(TEACHINGS.map((t) => t.id));
  });
});

describe('i18n', () => {
  it('has identical keys in gu, hi and en', () => {
    const k = (o: object) => Object.keys(o).sort();
    expect(k(gu)).toEqual(k(en));
    expect(k(hi)).toEqual(k(en));
  });
  it('keeps {placeholders} consistent', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(ph(gu[key]), key).toBe(ph(en[key]));
      expect(ph(hi[key]), key).toBe(ph(en[key]));
    }
  });
  it('has a label for every rubric category', () => {
    for (const c of Object.keys(rubric.categories)) expect(en).toHaveProperty(`cat.${c}`);
  });
});
