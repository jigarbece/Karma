import type { Category, KarmaType } from './types';
import { addDays } from './ghada';

export interface SampleAction {
  summary: string;
  type: KarmaType;
  category: Category;
  weight: number;
  reason: string;
}

const PUNYA: SampleAction[] = [
  { summary: 'Helped a neighbour carry groceries', type: 'punya', category: 'seva', weight: 2, reason: 'Quiet, unasked help.' },
  { summary: 'Fed the birds and a stray dog', type: 'punya', category: 'jeev_daya', weight: 2, reason: 'Compassion to living beings.' },
  { summary: 'Spent the evening with parents', type: 'punya', category: 'family_duty', weight: 3, reason: 'Gave time to family.' },
  { summary: 'Donated to a local food drive', type: 'punya', category: 'daan', weight: 3, reason: 'Generosity without show.' },
  { summary: 'Told the truth about a mistake at work', type: 'punya', category: 'satya', weight: 3, reason: 'Honesty had a cost.' },
  { summary: 'Morning prayer and walk', type: 'punya', category: 'gratitude_bhakti', weight: 1, reason: 'Steady daily practice.' },
  { summary: 'Stayed calm during a heated discussion', type: 'punya', category: 'krodh', weight: 2, reason: 'Patience under provocation.' },
  { summary: 'Finished work honestly and on time', type: 'punya', category: 'honesty_work', weight: 2, reason: 'Diligence.' },
  { summary: 'Skipped late-night snacks and slept early', type: 'punya', category: 'discipline_health', weight: 1, reason: 'Self-discipline.' },
];
const PAAP: SampleAction[] = [
  { summary: 'Snapped at a family member', type: 'paap', category: 'krodh', weight: 2, reason: 'Anger acted upon.' },
  { summary: 'Gossiped about a colleague', type: 'paap', category: 'vani', weight: 2, reason: 'Harsh speech about someone absent.' },
  { summary: 'Told a small lie to avoid a task', type: 'paap', category: 'satya', weight: 1, reason: 'Small untruth.' },
  { summary: 'Wasted the morning on the phone', type: 'paap', category: 'discipline_health', weight: 1, reason: 'Lack of discipline.' },
  { summary: 'Ignored a request for help', type: 'paap', category: 'seva', weight: 1, reason: 'A missed chance to help.' },
];

/** Deterministic sample history for demo mode and the seed script. */
export function sampleHistory(today: string, days = 30): Array<SampleAction & { date: string }> {
  const out: Array<SampleAction & { date: string }> = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = days - 1; i >= 1; i--) {
    const date = addDays(today, -i);
    const nP = 1 + Math.floor(rnd() * 3);
    const nQ = rnd() < 0.6 ? 1 : 0;
    for (let k = 0; k < nP; k++) out.push({ ...PUNYA[Math.floor(rnd() * PUNYA.length)], date });
    for (let k = 0; k < nQ; k++) out.push({ ...PAAP[Math.floor(rnd() * PAAP.length)], date });
  }
  // Today: a small starting point
  out.push({ ...PUNYA[0], date: today }, { ...PUNYA[5], date: today }, { ...PAAP[0], date: today });
  return out;
}
