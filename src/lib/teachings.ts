import raw from '../content/teachings.json';
import type { Category, Lang, Tradition } from './types';

export interface Teaching {
  id: string;
  source: string;
  traditions: string[];
  categories: string[];
  text: Record<Lang, string>;
}

export const TEACHINGS = raw as Teaching[];

export function getTeaching(id: string | undefined): Teaching | undefined {
  return TEACHINGS.find((t) => t.id === id);
}

/** Deterministic pick: best category + tradition match; ties broken by a stable hash of `seed`. */
export function pickTeaching(categories: Category[], tradition: Tradition, seed = ''): Teaching {
  const scored = TEACHINGS.map((t) => {
    let score = 0;
    for (const c of categories) if (t.categories.includes(c)) score += 2;
    if (t.traditions.includes(tradition)) score += 3;
    return { t, score };
  });
  const best = Math.max(...scored.map((s) => s.score));
  const pool = scored.filter((s) => s.score === best).map((s) => s.t);
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
