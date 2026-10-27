import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';
import { addDays, localDate, totalsForRange } from '../lib/ghada';
import { categoryTotals } from '../lib/insights';
import type { Category, KarmaAction, Range } from '../lib/types';
import { GhadaPair } from '../components/GhadaPair';
import { CategoryBars } from '../components/charts';
import { Segmented, Spinner } from '../components/ui';

/* ------------------------------------------------------------------------------------------------
 * Admin area: numbers, users, and one user's progress and ghadas.
 * It shows counts, dates and points. Diary messages and the wording of acts are never loaded here:
 * the app promises every user that what they write is private to their own account.
 * --------------------------------------------------------------------------------------------- */

const LANG_NAME: Record<string, string> = { gu: 'Gujarati', hi: 'Hindi', en: 'English' };
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : 'never');

interface Day { date: string; signups: number; analyses: number; visitors: number }
interface Stats {
  users_total: number; users_today: number; users_7d: number; onboarded: number;
  visitors_total: number; visitors_today: number; analyses_total: number; analyses_today: number; active_7d: number;
  by_language: Record<string, number>; daily: Day[];
}
interface AdminUser {
  id: string; email: string; name: string; language: string; onboarded: boolean;
  created_at: string; last_sign_in_at: string | null; blocked: boolean; admin: boolean; days_analysed: number;
  analysed_7d?: number; last_analysed_at?: string | null; punya_acts?: number; paap_acts?: number;
}
interface Group { date: string; type: 'punya' | 'paap'; category: Category; mode: string; points: number; count: number }

/** Calls the admin-only Edge Function. */
async function adminCall<T = unknown>(body: object): Promise<T> {
  const { data, error } = await supabase!.functions.invoke('admin-users', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const b = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => ({})) : {};
    throw new Error(b.error ?? error.message);
  }
  return data as T;
}

function Tile({ label, value, sub, testId }: { label: string; value: number | string; sub?: string; testId: string }) {
  return (
    <div className="card !p-4" data-testid={testId}>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-4xl font-bold leading-tight">{typeof value === 'number' ? fmt(value) : value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Bars for 14 days, scaled to the busiest day; every bar also carries its number. */
function DailyBars<T extends { date: string }>({ title, days, pick, color }: { title: string; days: T[]; pick: (d: T) => number; color: string }) {
  const max = Math.max(1, ...days.map(pick));
  return (
    <section className="card !p-4">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-3 flex h-32 items-end gap-1" role="img" aria-label={`${title}, last 14 days`}>
        {days.map((d) => (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] leading-none text-muted">{pick(d) || ''}</span>
            <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max(pick(d) > 0 ? 6 : 2, (pick(d) / max) * 100)}%` }} title={`${d.date}: ${pick(d)}`} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted"><span>{days[0]?.date.slice(5)}</span><span>{days.at(-1)?.date.slice(5)}</span></div>
    </section>
  );
}

/* ----------------------------------------------------------------------------- Overview */

function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    supabase!.rpc('admin_stats').then(({ data, error }) => {
      if (error) {
        setProblem(/not_admin|42501/.test(`${error.code} ${error.message}`) ? 'This account is not an admin.' : /admin_stats/.test(error.message) ? 'Run the admin SQL (20261029000000_admin_stats.sql) in Supabase first.' : error.message);
      } else setStats(data as Stats);
    });
  }, []);

  if (problem) return <p role="alert" className="card text-muted">{problem}</p>;
  if (!stats) return <Spinner label="Loading numbers" />;
  const langTotal = Math.max(1, Object.values(stats.by_language).reduce((a, b) => a + b, 0));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Overview</h1>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Tile testId="adm-users" label="Registered users" value={stats.users_total} sub={`${fmt(stats.onboarded)} finished setup`} />
        <Tile testId="adm-new" label="New today" value={stats.users_today} sub={`${fmt(stats.users_7d)} in the last 7 days`} />
        <Tile testId="adm-visitors" label="Visitors" value={stats.visitors_total} sub={`${fmt(stats.visitors_today)} new today`} />
        <Tile testId="adm-active" label="Active in 7 days" value={stats.active_7d} sub="people who said their day" />
        <Tile testId="adm-analyses" label="Days analysed" value={stats.analyses_total} sub={`${fmt(stats.analyses_today)} today`} />
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <DailyBars title="New users per day" days={stats.daily} pick={(d) => d.signups} color="bg-saffron" />
        <DailyBars title="Visitors per day" days={stats.daily} pick={(d) => d.visitors} color="bg-indigo" />
        <DailyBars title="Days analysed per day" days={stats.daily} pick={(d) => d.analyses} color="bg-good" />
      </div>
      <section className="card !p-4">
        <h2 className="font-display text-xl font-bold">Language chosen</h2>
        <ul className="mt-3 space-y-2">
          {Object.entries(stats.by_language).sort((a, b) => b[1] - a[1]).map(([l, n]) => (
            <li key={l} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0">{LANG_NAME[l] ?? l}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-saffron" style={{ width: `${(n / langTotal) * 100}%` }} /></div>
              <span className="w-10 shrink-0 text-right font-semibold">{fmt(n)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------------------- Users */

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    adminCall<{ users: AdminUser[] }>({ action: 'list' }).then((d) => setUsers(d.users)).catch((e) => setNote(`Could not load users: ${e.message}`));
  }, []);

  const shown = (users ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Users {users && <span className="font-sans text-lg font-normal text-muted">({fmt(users.length)})</span>}</h1>
        <input className="field !min-h-[40px] max-w-xs" placeholder="Search name or email" aria-label="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {note && <p role="alert" className="card text-muted">{note}</p>}
      {!users ? !note && <Spinner label="Loading users" /> : (
        <ul className="space-y-2">
          {shown.map((u) => (
            <li key={u.id} data-testid="admin-user">
              <Link to={`/admin/users/${u.id}`} className="card flex flex-wrap items-center gap-x-4 gap-y-1 !p-3 transition hover:border-saffron">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold">{u.name || '(no name)'} <span className="font-normal text-muted">{u.email}</span></p>
                  <p className="text-xs text-muted">
                    Joined {day(u.created_at)} · last seen {day(u.last_sign_in_at)} · {u.language ? (LANG_NAME[u.language] ?? u.language) : 'no language'}{u.onboarded ? '' : ' · setup not finished'}
                  </p>
                  <p className="text-xs" data-testid="admin-activity">
                    <span className="font-semibold">{fmt(u.days_analysed)}</span> days analysed ({fmt(u.analysed_7d ?? 0)} in 7 days, last {day(u.last_analysed_at ?? null)}) ·{' '}
                    <span className="font-semibold text-good">{fmt(u.punya_acts ?? 0)}</span> punya · <span className="font-semibold text-paapred">{fmt(u.paap_acts ?? 0)}</span> to reflect on
                  </p>
                </div>
                {u.admin && <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-saffron-text">Admin</span>}
                {u.blocked && <span className="rounded-full bg-indigo-soft px-2 py-0.5 text-xs font-semibold text-paapred">Blocked</span>}
                <span aria-hidden="true" className="text-saffron-text">›</span>
              </Link>
            </li>
          ))}
          {shown.length === 0 && <li className="text-muted">No users match.</li>}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------- One user */

const MODE_LABEL: Record<string, string> = { done: 'Deeds', refrained: 'Held back', regret: 'Repentance', intended: 'Intentions', thought: 'Thoughts' };

function UserDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t, num } = useI18n();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [problem, setProblem] = useState('');
  const [note, setNote] = useState('');
  const [range, setRange] = useState<Range>('week');
  const today = localDate();

  const load = useCallback(() => adminCall<{ user: AdminUser; groups: Group[] }>({ action: 'detail', id })
    .then((d) => { setUser(d.user); setGroups(d.groups); })
    .catch((e) => setProblem(`Could not load this user: ${e.message}`)), [id]);
  useEffect(() => { void load(); }, [load]);

  const act = async (action: 'block' | 'unblock' | 'delete') => {
    if (!user) return;
    if (action === 'delete' && window.prompt(`This permanently deletes ${user.email} and all their data. Type DELETE to confirm.`) !== 'DELETE') return;
    if (action === 'block' && !window.confirm(`Block ${user.email} from signing in?`)) return;
    try {
      await adminCall({ action, id });
      if (action === 'delete') navigate('/admin/users');
      else { setNote(action === 'block' ? 'Blocked.' : 'Unblocked.'); await load(); }
    } catch (e) {
      setNote(`Could not ${action}: ${(e as Error).message}`);
    }
  };

  if (problem) return <p role="alert" className="card text-muted">{problem}</p>;
  if (!user) return <Spinner label="Loading user" />;

  // each group is one day, type, category and mode with its summed points; the app's own ghada maths runs on them
  const actions: KarmaAction[] = groups.map((g, i) => ({
    id: `g${i}`, entry_id: '', summary: '', type: g.type, category: g.category, weight: g.points, basis: '',
    mode: g.mode as KarmaAction['mode'], reason: '', intention_note: '', date: g.date, created_at: '',
  }));
  const totals = totalsForRange(actions, range, today);
  const cats = categoryTotals(actions, range === 'today' ? 'week' : range, today);
  const modes = new Map<string, { punya: number; paap: number }>();
  for (const g of groups) {
    const m = modes.get(g.mode) ?? { punya: 0, paap: 0 };
    m[g.type] += g.count;
    modes.set(g.mode, m);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, -(13 - i));
    const on = groups.filter((g) => g.date === date);
    return { date, punya: on.filter((g) => g.type === 'punya').reduce((s, g) => s + g.points, 0), paap: on.filter((g) => g.type === 'paap').reduce((s, g) => s + g.points, 0) };
  });
  const lifetime = totalsForRange(actions, 'lifetime', today);

  return (
    <div className="space-y-5">
      <Link to="/admin/users" className="inline-block min-h-[44px] font-semibold text-saffron-text">← Users</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{user.name || '(no name)'}</h1>
          <p className="truncate text-muted">{user.email}</p>
          <p className="mt-1 flex flex-wrap gap-2 text-sm">
            {user.admin && <span className="rounded-full bg-gold/25 px-2 py-0.5 font-semibold text-saffron-text">Admin</span>}
            {user.blocked && <span className="rounded-full bg-indigo-soft px-2 py-0.5 font-semibold text-paapred">Blocked</span>}
            <span className="text-muted">{user.language ? LANG_NAME[user.language] ?? user.language : 'no language'}{user.onboarded ? '' : ' · setup not finished'}</span>
          </p>
        </div>
        {!user.admin && (
          <div className="flex gap-2">
            <button type="button" className="btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => act(user.blocked ? 'unblock' : 'block')}>{user.blocked ? 'Unblock' : 'Block'}</button>
            <button type="button" className="btn-ghost !min-h-[40px] !px-3 text-sm text-paapred" onClick={() => act('delete')}>Delete</button>
          </div>
        )}
      </header>
      {note && <p role="status" className="rounded-xl bg-indigo-soft p-2 text-sm">{note}</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile testId="u-joined" label="Joined" value={day(user.created_at)} sub={`last seen ${day(user.last_sign_in_at)}`} />
        <Tile testId="u-days" label="Days analysed" value={user.days_analysed} />
        <Tile testId="u-punya" label="Punya points, lifetime" value={lifetime.punya} />
        <Tile testId="u-paap" label="To reflect on, lifetime" value={lifetime.paap} />
      </div>

      <section className="stage-card" aria-labelledby="u-ghada">
        <div className="relative mb-4 text-center">
          <h2 id="u-ghada" className="font-display text-3xl font-bold">Their ghadas</h2>
          <p className="text-muted">Net {totals.net >= 0 ? '+' : '−'}{num(Math.abs(totals.net))} points</p>
        </div>
        <div className="relative mx-auto mb-5 max-w-xl">
          <Segmented label="Range" value={range} onChange={setRange} options={[
            { value: 'today', label: t('common.today') }, { value: 'week', label: t('common.week') },
            { value: 'month', label: t('common.month') }, { value: 'lifetime', label: t('common.lifetime') },
          ]} />
        </div>
        <GhadaPair punya={totals.punya} paap={totals.paap} range={range} />
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="card !p-4">
          <h2 className="font-display text-xl font-bold">By category</h2>
          <div className="mt-3">
            {cats.some((c) => c.punya > 0 || c.paap > 0)
              ? <CategoryBars rows={cats} name={(c) => t(`cat.${c}`)} num={num} />
              : <p className="text-muted">Nothing scored in this range.</p>}
          </div>
        </section>
        <section className="card !p-4">
          <h2 className="font-display text-xl font-bold">Deeds and thoughts</h2>
          <ul className="mt-3 space-y-2 text-sm" data-testid="u-modes">
            {[...modes.entries()].sort((a, b) => b[1].punya + b[1].paap - (a[1].punya + a[1].paap)).map(([m, c]) => (
              <li key={m} className="flex items-center justify-between gap-3">
                <span>{MODE_LABEL[m] ?? m}</span>
                <span><span className="font-semibold text-good">{fmt(c.punya)}</span> punya · <span className="font-semibold text-paapred">{fmt(c.paap)}</span> to reflect on</span>
              </li>
            ))}
            {modes.size === 0 && <li className="text-muted">Nothing scored yet.</li>}
          </ul>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <DailyBars title="Punya points per day" days={days} pick={(d) => d.punya} color="bg-good" />
        <DailyBars title="Points to reflect on per day" days={days} pick={(d) => d.paap} color="bg-paapred" />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- Layout */

export default function Admin() {
  if (!supabase) return <p role="alert" className="card text-muted">The admin panel needs the live Supabase project; it is not available in demo mode.</p>;
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[44px] items-center gap-2 rounded-xl px-4 font-semibold transition ${isActive ? 'bg-night text-cream shadow' : 'text-muted hover:bg-indigo-soft hover:text-ink'}`;
  return (
    <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Admin" className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
        <p className="hidden px-4 pb-1 font-display text-xl font-bold lg:block">Admin</p>
        <NavLink to="/admin" end className={link}>Overview</NavLink>
        <NavLink to="/admin/users" className={link}>Users</NavLink>
        <p className="hidden px-4 pt-3 text-xs text-muted lg:block">Counts, dates and points only. Diary messages and the wording of acts stay private to each user.</p>
      </nav>
      <div className="min-w-0">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetail />} />
        </Routes>
      </div>
    </div>
  );
}
