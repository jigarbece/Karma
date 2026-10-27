import type { Tithi } from './panchang';
import type { Category, KarmaAction } from './types';
import { addDays, signedWeight, streak, totalsForRange } from './ghada';

export { streak };

/** Words for a streak: only these round numbers get a milestone message. */
export const MILESTONES = [108, 21, 7, 3] as const;
export function milestone(days: number): number | null {
  return MILESTONES.find((m) => days >= m) ?? null;
}

/** Punya this week against the weekly goal. */
export function weeklyGoal(actions: KarmaAction[], today: string, goal: number) {
  const points = totalsForRange(actions, 'week', today).punya;
  return { points, goal, fraction: Math.max(0, Math.min(1, points / Math.max(1, goal))), reached: points >= goal };
}

export interface Festival {
  id: 'navratri' | 'diwali' | 'ekadashi' | 'shravan';
  /** any punya act in one of these categories today completes the day's challenge */
  categories: Category[];
}

/**
 * The festival or observance on this tithi, worked out from the moon (no hand-typed dates to get wrong).
 * Gujarati amanta months: 4 = Shravan, 6 = Aaso, 7 = Kartak.
 */
export function festivalFor(t: Tithi | null): Festival | null {
  if (!t) return null;
  if (t.monthIndex === 6 && t.paksha === 'sud' && t.day <= 9) return { id: 'navratri', categories: ['gratitude_bhakti', 'discipline_health'] };
  if ((t.monthIndex === 6 && t.paksha === 'vad' && t.day >= 13) || (t.monthIndex === 7 && t.paksha === 'sud' && t.day <= 2)) {
    return { id: 'diwali', categories: ['daan', 'seva', 'family_duty'] };
  }
  if (t.day === 11) return { id: 'ekadashi', categories: ['discipline_health', 'gratitude_bhakti'] };
  if (t.monthIndex === 4) return { id: 'shravan', categories: ['seva', 'jeev_daya', 'daan'] };
  return null;
}

/** Did the user already do something for the challenge today? */
export function festivalDoneToday(actions: KarmaAction[], today: string, f: Festival): boolean {
  return actions.some((a) => a.date === today && signedWeight(a) > 0 && f.categories.includes(a.category));
}

export { addDays };
