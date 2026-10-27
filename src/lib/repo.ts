import { supabase } from './supabase';
import { localDate } from './ghada';
import { mockAnalyze } from './mockAnalyze';
import { sampleHistory } from './sample';
import { sealLocal } from './seal';
import { getTeaching } from './teachings';
import type { AnalysisResult, Entry, KarmaAction, Lang, PratikramanRecord, Profile } from './types';

export interface AnalyzeResponse {
  entry: Entry | null;
  actions: KarmaAction[];
  reflection: { teaching_id: string; suggestion: string; suggestion_i18n?: Partial<Record<Lang, string>> } | null;
  safety_flag: boolean;
}

export class RateLimitError extends Error {
  constructor(public limit: number) {
    super('rate_limited');
  }
}

export class AnalyzeError extends Error {
  constructor(public code: string, public detail: string) {
    super(code);
  }
}

export interface DayReflection {
  date: string;
  teaching_id: string;
  suggestion: string;
}

export interface Repo {
  getProfile(): Promise<Profile | null>;
  saveProfile(patch: Partial<Profile>): Promise<Profile>;
  listActions(): Promise<KarmaAction[]>;
  listEntries(date: string): Promise<Entry[]>;
  /** Newest first, capped at 300. */
  listAllEntries(): Promise<Entry[]>;
  getReflection(date: string): Promise<DayReflection | null>;
  analyze(input: { transcript: string; date: string; language: string }): Promise<AnalyzeResponse>;
  addFeedback(actionId: string, comment: string): Promise<void>;
  listPratikraman(): Promise<PratikramanRecord[]>;
  savePratikraman(actionId: string, reflection: string, commitment: string): Promise<PratikramanRecord>;
  exportAll(): Promise<Record<string, unknown>>;
  deleteAll(): Promise<void>;
}

export const DAILY_ANALYSIS_LIMIT = Number(import.meta.env?.VITE_DAILY_ANALYSIS_LIMIT ?? 10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

type DevAnalysis = AnalysisResult & { provider?: string; model?: string };

/**
 * DEV ONLY: scores text through the local `/dev-api/analyze` endpoint (see vite.dev-ai.ts), which runs the
 * same pipeline as the Edge Function using AI keys from .env.local. Returns null when it is unavailable
 * (production build, tests, or no AI key configured) so callers fall back.
 */
async function devAnalyze(payload: { transcript: string; date: string; language: string; tradition: string; goals: string[] }): Promise<DevAnalysis | null> {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return null;
  try {
    const r = await fetch('/dev-api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await r.json().catch(() => null);
    if (r.ok && body && Array.isArray(body.actions)) return body as DevAnalysis;
    if (body && r.status !== 404 && r.status !== 501) throw new AnalyzeError(body.error ?? `http_${r.status}`, body.message ?? '');
  } catch (e) {
    if (e instanceof AnalyzeError) throw e;
  }
  return null;
}

/* ----------------------------------------------------------------------------------------
 * Demo / local repo (localStorage). Used when Supabase is not configured.
 * ------------------------------------------------------------------------------------- */
interface LocalDb {
  profile: Profile | null;
  entries: Entry[];
  actions: KarmaAction[];
  feedback: Array<{ id: string; action_id: string; comment: string; created_at: string }>;
  reflections: DayReflection[];
  pratikraman: PratikramanRecord[];
}
const LS_KEY = 'karma.demo.v1';

function preferredLang(): Profile['language'] {
  try {
    const l = localStorage.getItem('karma.lang');
    if (l === 'gu' || l === 'hi' || l === 'en') return l;
  } catch {
    /* ignore */
  }
  return 'gu';
}

export const defaultProfile = (id: string): Profile => ({
  id,
  name: '',
  language: preferredLang(),
  tradition: 'hindu_gita',
  greeting: 'jsk',
  goals: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  city: 'Ahmedabad',
  reminder_time: null,
  consent_at: null,
  onboarding_done: false,
  keep_words: true,
  theme: 'light',
});

function readDb(): LocalDb {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as LocalDb;
  } catch {
    /* ignore */
  }
  return { profile: null, entries: [], actions: [], feedback: [], reflections: [], pratikraman: [] };
}
function writeDb(db: LocalDb) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable */
  }
}

export function seedDemo(withSample: boolean): void {
  const db = readDb();
  if (db.profile) return;
  const profile = defaultProfile('demo-user');
  profile.name = 'Demo';
  profile.consent_at = new Date().toISOString();
  profile.onboarding_done = withSample;
  db.profile = profile;
  if (withSample) {
    const today = localDate(new Date(), profile.timezone);
    const byDate = new Map<string, string>();
    for (const s of sampleHistory(today)) {
      let entryId = byDate.get(s.date);
      if (!entryId) {
        entryId = uid();
        byDate.set(s.date, entryId);
        db.entries.push({ id: entryId, entry_date: s.date, transcript: null, language: 'en', created_at: `${s.date}T18:00:00.000Z` });
      }
      db.actions.push({
        id: uid(), entry_id: entryId, summary: s.summary, type: s.type, category: s.category, weight: s.weight, basis: s.basis,
        translations: { en: { summary: s.summary, reason: s.reason }, ...s.i18n },
        reason: s.reason, intention_note: '', date: s.date, created_at: `${s.date}T18:00:00.000Z`,
      });
    }
    db.reflections.push({ date: today, teaching_id: 'gita-2-47', suggestion: 'Tomorrow, pause for three breaths before responding when you feel tense.' });
  }
  writeDb(db);
}

export const localRepo: Repo = {
  async getProfile() {
    return readDb().profile;
  },
  async saveProfile(patch) {
    const db = readDb();
    db.profile = { ...(db.profile ?? defaultProfile('demo-user')), ...patch };
    writeDb(db);
    return db.profile;
  },
  async listActions() {
    return readDb().actions;
  },
  async listEntries(date) {
    return readDb().entries.filter((e) => e.entry_date === date);
  },
  async listAllEntries() {
    return [...readDb().entries].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 300);
  },
  async getReflection(date) {
    const r = readDb().reflections.filter((x) => x.date === date);
    return r[r.length - 1] ?? null;
  },
  async analyze({ transcript, date, language }) {
    const db = readDb();
    const profile = db.profile ?? defaultProfile('demo-user');
    // 'a-' ids mark entries created through analyze (seeded history does not count)
    const used = db.entries.filter((e) => e.entry_date === date && e.id.startsWith('a-')).length;
    if (used >= DAILY_ANALYSIS_LIMIT) throw new RateLimitError(DAILY_ANALYSIS_LIMIT);
    // Dev only: real AI through the local endpoint; falls back to the keyword mock without AI keys.
    let result: AnalysisResult | null = await devAnalyze({ transcript, date, language, tradition: profile.tradition, goals: profile.goals });
    if (!result) {
      await new Promise((r) => setTimeout(r, 700));
      result = mockAnalyze(transcript, profile, `${date}${transcript}`);
    }
    if (result.safety_flag) return { entry: null, actions: [], reflection: null, safety_flag: true };
    const entry: Entry = {
      id: `a-${uid()}`,
      entry_date: date,
      transcript: profile.keep_words ? await sealLocal(transcript) : null,
      language: language as Entry['language'],
      created_at: new Date().toISOString(),
    };
    const actions: KarmaAction[] = result.actions.map((a) => ({
      id: uid(), entry_id: entry.id, ...a, basis: a.basis ?? '', date, created_at: entry.created_at,
    }));
    db.entries.push(entry);
    db.actions.push(...actions);
    if (getTeaching(result.reflection.teaching_id)) db.reflections.push({ date, ...result.reflection });
    writeDb(db);
    return { entry, actions, reflection: result.reflection, safety_flag: false };
  },
  async addFeedback(action_id, comment) {
    const db = readDb();
    db.feedback.push({ id: uid(), action_id, comment, created_at: new Date().toISOString() });
    writeDb(db);
  },
  async listPratikraman() {
    return readDb().pratikraman;
  },
  async savePratikraman(action_id, reflection, commitment) {
    const db = readDb();
    const rec: PratikramanRecord = { id: uid(), action_id, reflection, commitment, created_at: new Date().toISOString() };
    db.pratikraman = [...db.pratikraman.filter((p) => p.action_id !== action_id), rec];
    writeDb(db);
    return rec;
  },
  async exportAll() {
    return { exported_at: new Date().toISOString(), ...readDb() };
  },
  async deleteAll() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* ----------------------------------------------------------------------------------------
 * Supabase repo. All reads/writes go through RLS as the signed-in user.
 * ------------------------------------------------------------------------------------- */
type Row = Record<string, unknown>;

function mapAction(r: Row): KarmaAction {
  return {
    id: r.id as string,
    entry_id: r.entry_id as string,
    summary: r.summary as string,
    type: r.type as KarmaAction['type'],
    category: r.category as KarmaAction['category'],
    weight: r.weight as number,
    basis: (r.basis as string) ?? '',
    translations: (r.translations as KarmaAction['translations']) ?? {},
    reason: (r.reason as string) ?? '',
    intention_note: (r.intention_note as string) ?? '',
    date: r.entry_date as string,
    created_at: r.created_at as string,
  };
}

export function makeSupabaseRepo(userId: string): Repo {
  const sb = supabase!;
  return {
    async getProfile() {
      const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
    async saveProfile(patch) {
      const { data, error } = await sb
        .from('profiles')
        .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
        .select('*')
        .single();
      if (error) throw error;
      return data as Profile;
    },
    async listActions() {
      const out: KarmaAction[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb
          .from('actions').select('*').order('created_at', { ascending: true }).range(from, from + 999);
        if (error) throw error;
        out.push(...(data as Row[]).map(mapAction));
        if (!data || data.length < 1000) break;
      }
      return out;
    },
    async listEntries(date) {
      const { data, error } = await sb.from('entries').select('*').eq('entry_date', date).order('created_at');
      if (error) throw error;
      return data as Entry[];
    },
    async listAllEntries() {
      const { data, error } = await sb.from('entries').select('*').order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return data as Entry[];
    },
    async getReflection(date) {
      const { data, error } = await sb
        .from('reflections').select('date,teaching_id,suggestion').eq('date', date)
        .order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return (data?.[0] as DayReflection | undefined) ?? null;
    },
    async analyze(input) {
      // Dev only: score locally with the key in .env.local, then save to Supabase as this user (RLS applies).
      const { data: prof } = await sb.from('profiles').select('tradition, goals, keep_words').eq('id', userId).maybeSingle();
      const local = await devAnalyze({
        transcript: input.transcript, date: input.date, language: input.language,
        tradition: prof?.tradition ?? 'general', goals: prof?.goals ?? [],
      });
      if (local) {
        if (local.safety_flag) return { entry: null, actions: [], reflection: null, safety_flag: true };
        const { data: entry, error: entryErr } = await sb.from('entries').insert({
          user_id: userId, entry_date: input.date, transcript: prof?.keep_words === false ? null : await sealLocal(input.transcript),
          language: input.language, ai_provider: local.provider ?? 'dev', ai_model: local.model ?? 'dev', rubric_version: 'v2',
        }).select('*').single();
        if (entryErr) throw new AnalyzeError('save_failed', entryErr.message);
        let rows: Row[] = [];
        if (local.actions.length) {
          const { data, error } = await sb.from('actions')
            .insert(local.actions.map((a) => ({ ...a, user_id: userId, entry_id: entry.id, entry_date: input.date }))).select('*');
          if (error) throw new AnalyzeError('save_failed', error.message);
          rows = data as Row[];
        }
        await sb.from('reflections').insert({ user_id: userId, date: input.date, teaching_id: local.reflection.teaching_id, suggestion: local.reflection.suggestion });
        return { entry: entry as Entry, actions: rows.map(mapAction), reflection: local.reflection, safety_flag: false };
      }

      const { data, error } = await sb.functions.invoke('analyze-day', { body: input });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json().catch(() => ({}));
          if (ctx.status === 429) throw new RateLimitError(body.limit ?? DAILY_ANALYSIS_LIMIT);
          throw new AnalyzeError(body.error ?? `http_${ctx.status}`, body.message ?? '');
        }
        throw new AnalyzeError('network', error.message ?? '');
      }
      return {
        entry: data.entry ?? null,
        actions: ((data.actions ?? []) as Row[]).map(mapAction),
        reflection: data.reflection ?? null,
        safety_flag: Boolean(data.safety_flag),
      };
    },
    async addFeedback(action_id, comment) {
      const { error } = await sb.from('action_feedback').insert({ user_id: userId, action_id, comment });
      if (error) throw error;
    },
    async listPratikraman() {
      const { data, error } = await sb.from('pratikraman').select('*').order('created_at');
      if (error) throw error;
      return data as PratikramanRecord[];
    },
    async savePratikraman(action_id, reflection, commitment) {
      await sb.from('pratikraman').delete().eq('action_id', action_id);
      const { data, error } = await sb
        .from('pratikraman').insert({ user_id: userId, action_id, reflection, commitment }).select('*').single();
      if (error) throw error;
      return data as PratikramanRecord;
    },
    async exportAll() {
      const tables = ['profiles', 'entries', 'actions', 'action_feedback', 'reflections', 'pratikraman'];
      const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
      for (const t of tables) {
        const { data, error } = await sb.from(t).select('*');
        if (error) throw error;
        out[t] = data;
      }
      return out;
    },
    async deleteAll() {
      const { error } = await sb.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      await sb.auth.signOut();
    },
  };
}
