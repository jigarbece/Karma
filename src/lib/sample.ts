import type { Category, KarmaType } from './types';
import { addDays } from './ghada';

export interface SampleAction {
  summary: string;
  type: KarmaType;
  category: Category;
  weight: number;
  basis: string;
  reason: string;
}

const PUNYA: SampleAction[] = [
  { summary: 'Helped a neighbour carry groceries', type: 'punya', category: 'seva', weight: 12, basis: 'paropakara', reason: 'Quiet, unasked help.' },
  { summary: 'Fed the birds and a stray dog', type: 'punya', category: 'jeev_daya', weight: 9, basis: 'go_jeev_seva', reason: 'Compassion to living beings.' },
  { summary: 'Spent the evening with parents', type: 'punya', category: 'family_duty', weight: 22, basis: 'matri_pitri_seva', reason: 'Gave time to elders.' },
  { summary: 'Donated food to a local food drive', type: 'punya', category: 'daan', weight: 28, basis: 'annadana', reason: 'Feeding the hungry carries great merit.' },
  { summary: 'Told the truth about a mistake at work', type: 'punya', category: 'satya', weight: 24, basis: 'satya', reason: 'Honesty had a personal cost.' },
  { summary: 'Morning prayer and Gita reading', type: 'punya', category: 'gratitude_bhakti', weight: 7, basis: 'bhakti_sadhana', reason: 'Steady daily practice.' },
  { summary: 'Stayed calm during a heated discussion', type: 'punya', category: 'krodh', weight: 15, basis: 'kshama', reason: 'Patience under provocation.' },
  { summary: 'Finished work honestly and on time', type: 'punya', category: 'honesty_work', weight: 11, basis: 'svadharma', reason: 'Duty done with care.' },
  { summary: 'Skipped late-night snacks and slept early', type: 'punya', category: 'discipline_health', weight: 5, basis: 'dama_shaucha', reason: 'Self-control.' },
];
const PAAP: SampleAction[] = [
  { summary: 'Snapped at a family member', type: 'paap', category: 'krodh', weight: 13, basis: 'krodha', reason: 'Anger acted upon.' },
  { summary: 'Gossiped about a colleague', type: 'paap', category: 'vani', weight: 9, basis: 'parusha_vani', reason: 'Harsh speech about someone absent.' },
  { summary: 'Told a small lie to avoid a task', type: 'paap', category: 'satya', weight: 6, basis: 'asatya', reason: 'A small untruth.' },
  { summary: 'Wasted the morning on the phone', type: 'paap', category: 'discipline_health', weight: 5, basis: 'pramada_vyasana', reason: 'Lack of self-discipline.' },
  { summary: 'Ignored a request for help', type: 'paap', category: 'seva', weight: 7, basis: 'seva_upeksha', reason: 'A missed chance to help.' },
];

/** Deterministic sample history for demo mode and the seed script. Points vary per act. */
export function sampleHistory(today: string, days = 30): Array<SampleAction & { date: string }> {
  const out: Array<SampleAction & { date: string }> = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const jitter = (a: SampleAction): SampleAction => ({ ...a, weight: Math.max(1, a.weight + Math.floor(rnd() * 7) - 3) });
  for (let i = days - 1; i >= 1; i--) {
    const date = addDays(today, -i);
    const nP = 1 + Math.floor(rnd() * 3);
    const nQ = rnd() < 0.6 ? 1 : 0;
    for (let k = 0; k < nP; k++) out.push({ ...jitter(PUNYA[Math.floor(rnd() * PUNYA.length)]), date });
    for (let k = 0; k < nQ; k++) out.push({ ...jitter(PAAP[Math.floor(rnd() * PAAP.length)]), date });
  }
  // Today: a small starting point
  out.push({ ...PUNYA[0], date: today }, { ...PUNYA[5], date: today }, { ...PAAP[0], date: today });
  return out;
}
