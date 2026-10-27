import { CATEGORIES, type Category, type KarmaAction } from './types';
import { addDays, signedWeight } from './ghada';

export type InsightRange = 'week' | 'month' | 'lifetime';

export interface CategoryRow {
  category: Category;
  punya: number;
  paap: number;
  net: number;
}

export interface TrendPoint {
  /** first day covered by this point (YYYY-MM-DD) */
  date: string;
  net: number;
}

const DAYS: Record<InsightRange, number> = { week: 7, month: 30, lifetime: 0 };

/** Points per category inside the range (all 11 categories, zero-filled). */
export function categoryTotals(actions: KarmaAction[], range: InsightRange, today: string): CategoryRow[] {
  const days = DAYS[range];
  const from = days ? addDays(today, -(days - 1)) : '0000-00-00';
  const rows = new Map<Category, CategoryRow>(CATEGORIES.map((c) => [c, { category: c, punya: 0, paap: 0, net: 0 }]));
  for (const a of actions) {
    if (a.type === 'neutral' || a.date < from || a.date > today) continue;
    const r = rows.get(a.category)!;
    const w = signedWeight(a);
    if (w > 0) r.punya += w;
    else r.paap += -w;
    r.net += w;
  }
  return [...rows.values()];
}

/** The category with the most Punya, if any. */
export function strongestCategory(rows: CategoryRow[]): CategoryRow | undefined {
  return rows.filter((r) => r.punya > 0).sort((a, b) => b.punya - a.punya)[0];
}

/** The category with the most Paap (the clearest growth area), if any. */
export function growthCategory(rows: CategoryRow[]): CategoryRow | undefined {
  return rows.filter((r) => r.paap > 0).sort((a, b) => b.paap - a.paap)[0];
}

/**
 * Net karma over time: one point per day for week (7) and month (30), one point per week for lifetime
 * (the last 26 weeks). Days with no activity are zero.
 */
export function trendPoints(actions: KarmaAction[], range: InsightRange, today: string): TrendPoint[] {
  const net = new Map<string, number>();
  for (const a of actions) {
    if (a.type === 'neutral') continue;
    net.set(a.date, (net.get(a.date) ?? 0) + signedWeight(a));
  }
  if (range === 'lifetime') {
    return Array.from({ length: 26 }, (_, i) => {
      const start = addDays(today, -(26 - i) * 7 + 1);
      let sum = 0;
      for (let d = 0; d < 7; d++) sum += net.get(addDays(start, d)) ?? 0;
      return { date: start, net: sum };
    });
  }
  const n = DAYS[range];
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, -(n - 1 - i));
    return { date, net: net.get(date) ?? 0 };
  });
}

export const hasActivity = (rows: CategoryRow[]): boolean => rows.some((r) => r.punya > 0 || r.paap > 0);
