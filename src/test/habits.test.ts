import { festivalDoneToday, festivalFor, milestone, weeklyGoal } from '../lib/habits';
import type { KarmaAction } from '../lib/types';

const act = (date: string, category: KarmaAction['category'], weight = 10, type: KarmaAction['type'] = 'punya'): KarmaAction => ({
  id: `${date}-${category}-${weight}-${type}`, entry_id: 'e', summary: '', type, category, weight, basis: '', reason: '', intention_note: '', date, created_at: '',
});
const t = (monthIndex: number, paksha: 'sud' | 'vad', day: number) => ({ monthIndex, paksha, day, number: paksha === 'sud' ? day : 15 + day });

describe('streak words', () => {
  it('gives a milestone only from the round numbers up', () => {
    expect([0, 2, 3, 6, 7, 20, 21, 107, 108, 400].map(milestone)).toEqual([null, null, 3, 3, 7, 7, 21, 21, 108, 108]);
  });
});

describe('weekly goal', () => {
  it('counts only this week\'s punya and says when it is reached', () => {
    const actions = [act('2026-10-27', 'seva', 60), act('2026-10-25', 'daan', 30), act('2026-10-10', 'seva', 500), act('2026-10-27', 'krodh', 40, 'paap')];
    const g = weeklyGoal(actions, '2026-10-27', 100);
    expect(g.points).toBe(90);
    expect(g.reached).toBe(false);
    expect(g.fraction).toBeCloseTo(0.9);
    expect(weeklyGoal([...actions, act('2026-10-26', 'seva', 20)], '2026-10-27', 100).reached).toBe(true);
  });
});

describe('festival challenges from the tithi', () => {
  it('finds Navratri, Diwali, Ekadashi and Shravan', () => {
    expect(festivalFor(t(6, 'sud', 3))?.id).toBe('navratri');
    expect(festivalFor(t(6, 'sud', 10))?.id).not.toBe('navratri');
    expect(festivalFor(t(6, 'vad', 14))?.id).toBe('diwali');
    expect(festivalFor(t(7, 'sud', 1))?.id).toBe('diwali');
    expect(festivalFor(t(1, 'sud', 11))?.id).toBe('ekadashi');
    expect(festivalFor(t(4, 'vad', 5))?.id).toBe('shravan');
    expect(festivalFor(t(2, 'sud', 5))).toBeNull();
    expect(festivalFor(null)).toBeNull();
  });
  it('is done today only by punya in the right category today', () => {
    const f = festivalFor(t(6, 'sud', 3))!;
    expect(festivalDoneToday([act('2026-10-27', 'gratitude_bhakti')], '2026-10-27', f)).toBe(true);
    expect(festivalDoneToday([act('2026-10-26', 'gratitude_bhakti')], '2026-10-27', f)).toBe(false);
    expect(festivalDoneToday([act('2026-10-27', 'seva')], '2026-10-27', f)).toBe(false);
    expect(festivalDoneToday([act('2026-10-27', 'gratitude_bhakti', 5, 'paap')], '2026-10-27', f)).toBe(false);
  });
});
