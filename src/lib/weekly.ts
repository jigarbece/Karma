import { addDays, totalsForRange } from './ghada';
import { categoryTotals, growthCategory, strongestCategory } from './insights';
import type { Category, KarmaAction } from './types';

export interface WeeklySummary {
  punya: number;
  prevPunya: number;
  /** percent change on last week; null when last week had no punya to compare with */
  changePct: number | null;
  strongest: Category | null;
  /** the one area to grow: where most paap fell this week (private: never put on a shared card) */
  grow: Category | null;
  activeDays: number;
}

/** This week (the last 7 days, today included) against the 7 days before. */
export function weeklySummary(actions: KarmaAction[], today: string): WeeklySummary {
  const now = totalsForRange(actions, 'week', today);
  const prev = totalsForRange(actions, 'week', addDays(today, -7));
  const rows = categoryTotals(actions, 'week', today);
  const from = addDays(today, -6);
  const days = new Set(actions.filter((a) => a.type !== 'neutral' && a.date >= from && a.date <= today).map((a) => a.date));
  return {
    punya: now.punya,
    prevPunya: prev.punya,
    changePct: prev.punya > 0 ? Math.round(((now.punya - prev.punya) / prev.punya) * 100) : null,
    strongest: strongestCategory(rows)?.category ?? null,
    grow: growthCategory(rows)?.category ?? null,
    activeDays: days.size,
  };
}
