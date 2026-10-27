import type { Lang } from './types';

/** One row of the punya leaderboard. The name is already half masked: the full name never reaches the browser. */
export interface Leader { rank: number; name: string; points: number; me: boolean }

/** This week's common punya ghada and leaderboard (from the `community_board` database function). */
export interface Board {
  week_total: number;
  goal: number;
  participants: number;
  leaders: Leader[];
  me: { rank: number; points: number } | null;
  my_points: number;
  next_up: { rank: number; name: string; points: number } | null;
}

export interface Announcement { id: number; message: Partial<Record<Lang, string>> }
export interface AppSettings { community_goal: number; personal_goal: number }
export const DEFAULT_SETTINGS: AppSettings = { community_goal: 2000, personal_goal: 100 };

/** "Jigar Pandya" -> "Jig** Pan***": the first half of every word stays, the rest is hidden. Mirrors `mask_name` in SQL. */
export function maskName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Karma friend';
  return words
    .map((w) => {
      const chars = [...w];
      if (chars.length <= 1) return w;
      const keep = Math.ceil(chars.length / 2);
      return chars.slice(0, keep).join('') + '*'.repeat(chars.length - keep);
    })
    .join(' ');
}

/** What to say to the user: they lead, or how many points they need to pass the leader and the next person up. */
export function chase(board: Board): { state: 'leading' | 'chasing' | 'new' | 'empty'; toLead: number; toNext: number } {
  const leader = board.leaders[0];
  if (!leader) return { state: 'empty', toLead: 0, toNext: 0 };
  if (board.me?.rank === 1) return { state: 'leading', toLead: 0, toNext: 0 };
  const toLead = Math.max(1, leader.points - board.my_points + 1);
  const toNext = board.next_up ? Math.max(1, board.next_up.points - board.my_points + 1) : toLead;
  return { state: board.my_points > 0 ? 'chasing' : 'new', toLead, toNext };
}

/** Demo mode: a made-up community so the board can be seen without a backend. */
export function demoBoard(myName: string, myPoints: number, goal = DEFAULT_SETTINGS.community_goal): Board {
  const people: Array<{ name: string; points: number; me: boolean }> = [
    { name: 'Aarav Shah', points: 96, me: false }, { name: 'Meera Patel', points: 81, me: false }, { name: 'Kavya Joshi', points: 64, me: false },
    { name: 'Rohan Mehta', points: 52, me: false }, { name: 'Isha Desai', points: 40, me: false }, { name: 'Dev Trivedi', points: 22, me: false },
  ];
  if (myPoints > 0) people.push({ name: myName || 'You', points: myPoints, me: true });
  const ranked = people.sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));
  const me = ranked.find((p) => p.me);
  return {
    week_total: ranked.reduce((s, p) => s + p.points, 0),
    goal,
    participants: ranked.length,
    leaders: ranked.slice(0, 5).map((p) => ({ rank: p.rank, name: maskName(p.name), points: p.points, me: p.me })),
    me: me ? { rank: me.rank, points: me.points } : null,
    my_points: myPoints,
    next_up: me && me.rank > 1 ? { rank: me.rank - 1, name: maskName(ranked[me.rank - 2].name), points: ranked[me.rank - 2].points } : null,
  };
}
