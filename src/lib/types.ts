export type Lang = 'gu' | 'hi' | 'en';
export type Tradition = 'hindu_gita' | 'jain' | 'swaminarayan' | 'general';
export type Greeting = 'jsk' | 'jj' | 'jsw' | 'namaste' | 'radhe';
export type KarmaType = 'punya' | 'paap' | 'neutral';
export type Range = 'today' | 'week' | 'month' | 'lifetime';

export const CATEGORIES = [
  'seva',
  'family_duty',
  'jeev_daya',
  'satya',
  'vani',
  'krodh',
  'honesty_work',
  'daan',
  'discipline_health',
  'gratitude_bhakti',
  'ahimsa_food',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const GOALS = ['less_anger', 'more_seva', 'truthful_speech', 'patience', 'family_time', 'discipline', 'daan'] as const;
export type Goal = (typeof GOALS)[number];

/** Which rubric categories each personal goal is measured by. */
export const GOAL_CATEGORIES: Record<Goal, Category[]> = {
  less_anger: ['krodh'],
  more_seva: ['seva', 'jeev_daya'],
  truthful_speech: ['satya', 'vani'],
  patience: ['krodh', 'vani'],
  family_time: ['family_duty'],
  discipline: ['discipline_health', 'honesty_work'],
  daan: ['daan'],
};

export interface Profile {
  id: string;
  name: string;
  language: Lang;
  tradition: Tradition;
  greeting: Greeting;
  goals: Goal[];
  timezone: string;
  city: string;
  reminder_time: string | null;
  consent_at: string | null;
  onboarding_done: boolean;
  keep_words: boolean;
  /** show me (name half hidden) on the community board; true unless the user turned it off */
  show_on_board?: boolean;
  theme: 'light' | 'dark';
}

/**
 * What the person did with it: actually did or said it (done), held back from wrong (refrained), regrets a wrong (regret),
 * means to do it (intended) or only thought it (thought). A thought or plan scores less than a deed.
 */
export type ActionMode = 'done' | 'refrained' | 'regret' | 'intended' | 'thought';

export interface KarmaAction {
  id: string;
  entry_id: string;
  summary: string;
  type: KarmaType;
  category: Category;
  weight: number; // points: positive integer 1-50; sign derived from type
  basis: string; // dharma principle id (rubric v3), '' when unknown
  /** older rows have none and count as a deed */
  mode?: ActionMode;
  /** summary + reason in each app language; older rows have none and fall back to `summary` */
  translations?: Partial<Record<Lang, { summary: string; reason: string }>>;
  reason: string;
  intention_note: string;
  date: string; // entry_date (YYYY-MM-DD)
  created_at: string;
}

export interface Entry {
  id: string;
  entry_date: string;
  transcript: string | null;
  language: Lang;
  created_at: string;
}

export interface PratikramanRecord {
  id: string;
  action_id: string;
  reflection: string;
  commitment: string;
  created_at: string;
}

export interface AnalysisResult {
  actions: Array<{
    summary: string;
    type: KarmaType;
    category: Category;
    weight: number;
    basis?: string;
    mode?: ActionMode;
    reason: string;
    intention_note: string;
    translations?: Partial<Record<Lang, { summary: string; reason: string }>>;
  }>;
  reflection: { teaching_id: string; suggestion: string; suggestion_i18n?: Partial<Record<Lang, string>> };
  safety_flag: boolean;
}

export interface DaySummary {
  date: string;
  punya: number;
  paap: number;
  net: number;
  byCategory: Partial<Record<Category, number>>; // signed
}
