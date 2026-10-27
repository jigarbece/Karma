import { readFileSync } from 'node:fs';
import en from '../i18n/en.json';
import gu from '../i18n/gu.json';
import hi from '../i18n/hi.json';
import { TEACHINGS } from '../lib/teachings';
import { CATEGORIES } from '../lib/types';
import { PRINCIPLE_TEXT } from '../content/principleText';
import rubric from '../../supabase/functions/_shared/rubric.v2.json';

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

describe('dharma rubric v2', () => {
  it('has unique principles with valid ranges, categories and sources', () => {
    const ids = rubric.principles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(rubric.principles.length).toBeGreaterThanOrEqual(20);
    for (const p of rubric.principles) {
      expect(p.range[0]).toBeGreaterThanOrEqual(1);
      expect(p.range[1]).toBeLessThanOrEqual(50);
      expect(p.range[0]).toBeLessThan(p.range[1]);
      expect(['punya', 'paap']).toContain(p.type);
      expect(Object.keys(rubric.categories)).toContain(p.category);
      expect(p.source.length).toBeGreaterThan(5);
    }
  });
  it('covers both merit and growth principles', () => {
    expect(rubric.principles.filter((p) => p.type === 'punya').length).toBeGreaterThan(8);
    expect(rubric.principles.filter((p) => p.type === 'paap').length).toBeGreaterThan(8);
  });
});

describe('dharma principle translations', () => {
  it('has a Gujarati and Hindi name, description and source for every principle', () => {
    for (const p of rubric.principles) {
      for (const l of ['gu', 'hi'] as const) {
        const t = PRINCIPLE_TEXT[p.id]?.[l];
        expect(t, `${p.id} ${l}`).toBeDefined();
        expect(t!.label.length).toBeGreaterThan(1);
        expect(t!.about.length).toBeGreaterThan(5);
        expect(t!.source.length).toBeGreaterThan(5);
      }
      expect(PRINCIPLE_TEXT[p.id].gu.label).toMatch(/[\u0A80-\u0AFF]/); // Gujarati script
      expect(PRINCIPLE_TEXT[p.id].hi.label).toMatch(/[\u0900-\u097F]/); // Devanagari
    }
  });
});
