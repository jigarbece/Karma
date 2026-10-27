import { weeklySummary } from '../lib/weekly';
import type { KarmaAction } from '../lib/types';

const act = (date: string, category: KarmaAction['category'], weight: number, type: KarmaAction['type'] = 'punya'): KarmaAction => ({
  id: `${date}-${category}-${weight}-${type}`, entry_id: 'e', summary: '', type, category, weight, basis: '', reason: '', intention_note: '', date, created_at: '',
});

describe('weekly summary', () => {
  const today = '2026-10-27';
  it('compares this week with last week and names the strongest and growth areas', () => {
    const actions = [
      act('2026-10-27', 'seva', 40), act('2026-10-25', 'seva', 20), act('2026-10-24', 'daan', 10), act('2026-10-26', 'krodh', 15, 'paap'),
      act('2026-10-18', 'seva', 50), // last week
    ];
    const w = weeklySummary(actions, today);
    expect(w.punya).toBe(70);
    expect(w.prevPunya).toBe(50);
    expect(w.changePct).toBe(40);
    expect(w.strongest).toBe('seva');
    expect(w.grow).toBe('krodh');
    expect(w.activeDays).toBe(4);
  });
  it('has no percentage when last week was empty, and nothing to name when nothing happened', () => {
    expect(weeklySummary([act('2026-10-27', 'seva', 10)], today).changePct).toBeNull();
    const none = weeklySummary([], today);
    expect(none).toMatchObject({ punya: 0, strongest: null, grow: null, activeDays: 0 });
  });
  it('can show a fall', () => {
    expect(weeklySummary([act('2026-10-27', 'seva', 10), act('2026-10-18', 'seva', 40)], today).changePct).toBe(-75);
  });
});
