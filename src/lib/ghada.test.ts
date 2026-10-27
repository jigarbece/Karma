import { addDays, fillFraction, localDate, longestStreak, netSeries, streak, totalsForRange } from './ghada';
import type { KarmaAction } from './types';

const act = (date: string, type: 'punya' | 'paap', weight: number): KarmaAction => ({
  id: `${date}-${type}-${weight}`, entry_id: 'e', summary: 's', type, category: 'seva', weight, reason: '', intention_note: '', date, created_at: '',
});

describe('ghada math', () => {
  it('fills at 50 points per day and scales for week/month', () => {
    expect(fillFraction(25, 'today')).toBe(0.5);
    expect(fillFraction(50, 'today')).toBe(1);
    expect(fillFraction(999, 'today')).toBe(1);
    expect(fillFraction(175, 'week')).toBeCloseTo(0.5);
    expect(fillFraction(750, 'month')).toBeCloseTo(0.5);
  });
  it('uses a log scale for lifetime', () => {
    const a = fillFraction(100, 'lifetime');
    const b = fillFraction(1000, 'lifetime');
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(b - a).toBeLessThan(0.35);
    expect(fillFraction(0, 'lifetime')).toBe(0);
  });
  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('totals punya, paap and net inside the range only', () => {
    const acts = [act('2026-10-26', 'punya', 3), act('2026-10-26', 'paap', 2), act('2026-10-25', 'punya', 5)];
    expect(totalsForRange(acts, 'today', '2026-10-26')).toEqual({ punya: 3, paap: 2, net: 1 });
    expect(totalsForRange(acts, 'week', '2026-10-26')).toEqual({ punya: 8, paap: 2, net: 6 });
  });
  it('builds a net series with zero-filled days', () => {
    const s = netSeries([act('2026-10-26', 'punya', 2)], '2026-10-26', 3);
    expect(s.map((d) => d.net)).toEqual([0, 0, 2]);
  });
  it('counts a streak of non-negative days', () => {
    const acts = [act('2026-10-24', 'punya', 1), act('2026-10-25', 'punya', 1), act('2026-10-26', 'punya', 1)];
    expect(streak(acts, '2026-10-26')).toBe(3);
    expect(streak([act('2026-10-26', 'paap', 2)], '2026-10-26')).toBe(0);
  });
  it('finds the longest streak ever, not just the current one', () => {
    const acts = [
      act('2026-10-01', 'punya', 1), act('2026-10-02', 'punya', 1), act('2026-10-03', 'punya', 1), act('2026-10-04', 'punya', 1),
      act('2026-10-05', 'paap', 3), // breaks the run
      act('2026-10-26', 'punya', 1),
    ];
    expect(longestStreak(acts)).toBe(4);
    expect(longestStreak([])).toBe(0);
  });
  it('formats a local date in a time zone', () => {
    expect(localDate(new Date('2026-10-25T20:00:00Z'), 'Asia/Kolkata')).toBe('2026-10-26');
  });
});
