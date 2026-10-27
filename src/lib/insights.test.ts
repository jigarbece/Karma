import { categoryTotals, growthCategory, hasActivity, strongestCategory, trendPoints } from './insights';
import type { Category, KarmaAction } from './types';

const act = (date: string, type: 'punya' | 'paap', weight: number, category: Category): KarmaAction => ({
  id: `${date}-${category}-${type}-${weight}`, entry_id: 'e', summary: 's', type, category, weight, basis: '', reason: '', intention_note: '', date, created_at: '',
});

const A = [
  act('2026-10-27', 'punya', 20, 'daan'),
  act('2026-10-27', 'paap', 9, 'vani'),
  act('2026-10-26', 'punya', 12, 'seva'),
  act('2026-10-26', 'paap', 14, 'krodh'),
  act('2026-10-01', 'punya', 30, 'daan'), // outside the week, inside the month
  act('2026-08-01', 'paap', 40, 'satya'), // outside the month
];

describe('insights', () => {
  it('totals points per category inside the range, zero-filled for the rest', () => {
    const week = categoryTotals(A, 'week', '2026-10-27');
    expect(week).toHaveLength(11);
    expect(week.find((r) => r.category === 'daan')).toMatchObject({ punya: 20, paap: 0, net: 20 });
    expect(week.find((r) => r.category === 'krodh')).toMatchObject({ punya: 0, paap: 14, net: -14 });
    expect(week.find((r) => r.category === 'satya')).toMatchObject({ punya: 0, paap: 0 });
    const month = categoryTotals(A, 'month', '2026-10-27');
    expect(month.find((r) => r.category === 'daan')!.punya).toBe(50);
    const life = categoryTotals(A, 'lifetime', '2026-10-27');
    expect(life.find((r) => r.category === 'satya')!.paap).toBe(40);
  });

  it('finds the strongest area and the clearest growth area', () => {
    const rows = categoryTotals(A, 'week', '2026-10-27');
    expect(strongestCategory(rows)?.category).toBe('daan');
    expect(growthCategory(rows)?.category).toBe('krodh');
    expect(strongestCategory(categoryTotals([], 'week', '2026-10-27'))).toBeUndefined();
    expect(hasActivity(rows)).toBe(true);
    expect(hasActivity(categoryTotals([], 'week', '2026-10-27'))).toBe(false);
  });

  it('builds a daily trend for week and month and a weekly trend for lifetime', () => {
    const week = trendPoints(A, 'week', '2026-10-27');
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ date: '2026-10-27', net: 11 }); // +20 -9
    expect(week[5].net).toBe(-2); // +12 -14
    expect(trendPoints(A, 'month', '2026-10-27')).toHaveLength(30);
    const life = trendPoints(A, 'lifetime', '2026-10-27');
    expect(life).toHaveLength(26);
    expect(life[life.length - 1].net).toBe(9); // last 7 days: 11 - 2
  });
});
