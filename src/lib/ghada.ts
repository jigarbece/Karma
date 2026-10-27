import type { DaySummary, KarmaAction, Range } from './types';

/** Points that fill a pot for one day. Acts score 1-50 each, so a full day of sincere acts is around 100. */
export const DAILY_CAP = Number(import.meta.env?.VITE_GHADA_DAILY_CAP ?? 100);

export function rangeDays(range: Range): number {
  return range === 'today' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 0;
}

/** Fraction (0..1) of the pot that is filled for a point total. */
export function fillFraction(points: number, range: Range, cap = DAILY_CAP): number {
  const p = Math.max(0, points);
  if (range === 'lifetime') {
    // log scale: ~1 year of full days (cap*365) fills the pot
    return Math.min(1, Math.log10(1 + p) / Math.log10(1 + cap * 365));
  }
  return Math.min(1, p / (cap * rangeDays(range)));
}

export function signedWeight(a: Pick<KarmaAction, 'type' | 'weight'>): number {
  return a.type === 'punya' ? Math.abs(a.weight) : a.type === 'paap' ? -Math.abs(a.weight) : 0;
}

export function localDate(d = new Date(), timeZone?: string): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function summarizeByDay(actions: KarmaAction[]): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  for (const a of actions) {
    if (a.type === 'neutral') continue;
    const s = map.get(a.date) ?? { date: a.date, punya: 0, paap: 0, net: 0, byCategory: {} };
    const w = signedWeight(a);
    if (w > 0) s.punya += w;
    else s.paap += -w;
    s.net = s.punya - s.paap;
    s.byCategory[a.category] = (s.byCategory[a.category] ?? 0) + w;
    map.set(a.date, s);
  }
  return map;
}

export function totalsForRange(actions: KarmaAction[], range: Range, today: string) {
  const days = rangeDays(range);
  const from = days ? addDays(today, -(days - 1)) : '0000-00-00';
  let punya = 0;
  let paap = 0;
  for (const a of actions) {
    if (a.date < from || a.date > today || a.type === 'neutral') continue;
    const w = signedWeight(a);
    if (w > 0) punya += w;
    else paap += -w;
  }
  return { punya, paap, net: punya - paap };
}

/** Net karma for each of `n` days ending at `end` (inclusive). */
export function netSeries(actions: KarmaAction[], end: string, n: number) {
  const byDay = summarizeByDay(actions);
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(end, -(n - 1 - i));
    const s = byDay.get(date);
    return { date, net: s?.net ?? 0, punya: s?.punya ?? 0, paap: s?.paap ?? 0 };
  });
}

/** Longest run of consecutive days with at least one scored action and net >= 0, ever. */
export function longestStreak(actions: KarmaAction[]): number {
  const byDay = summarizeByDay(actions);
  const days = [...byDay.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    const ok = byDay.get(d)!.net >= 0;
    run = ok ? (prev && addDays(prev, 1) === d ? run + 1 : 1) : 0;
    prev = d;
    if (run > best) best = run;
  }
  return best;
}

/** Consecutive days (ending today or yesterday) with net >= 0 and at least one scored action. */
export function streak(actions: KarmaAction[], today: string): number {
  const byDay = summarizeByDay(actions);
  let day = byDay.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (byDay.has(day) && byDay.get(day)!.net >= 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
