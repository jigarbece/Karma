import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui';

interface Day { date: string; signups: number; analyses: number; visitors: number }
interface Stats {
  users_total: number; users_today: number; users_7d: number; onboarded: number;
  visitors_total: number; visitors_today: number; analyses_total: number; analyses_today: number; active_7d: number;
  by_language: Record<string, number>; daily: Day[];
}

const LANG_NAME: Record<string, string> = { gu: 'Gujarati', hi: 'Hindi', en: 'English' };
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

function Tile({ label, value, sub, testId }: { label: string; value: number; sub?: string; testId: string }) {
  return (
    <div className="card !p-4" data-testid={testId}>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-4xl font-bold leading-tight">{fmt(value)}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Bars for the last 14 days. Scaled to the busiest day; every bar also carries its number. */
function DailyBars({ title, days, pick, color }: { title: string; days: Day[]; pick: (d: Day) => number; color: string }) {
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

interface AdminUser {
  id: string; email: string; name: string; language: string; onboarded: boolean;
  created_at: string; last_sign_in_at: string | null; blocked: boolean; admin: boolean; days_analysed: number;
  analysed_7d: number; last_analysed_at: string | null; punya_acts: number; paap_acts: number;
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : 'never');

/** Everyone who registered, with block / unblock / delete. Shows no diary text, acts or points: those stay private to each user. */
function Users() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const call = async (body: object) => {
    const { data, error } = await supabase!.functions.invoke('admin-users', { body });
    if (error) {
      const ctx = (error as { context?: Response }).context;
      const b = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => ({})) : {};
      throw new Error(b.error ?? error.message);
    }
    return data;
  };
  const load = () => call({ action: 'list' }).then((d) => setUsers(d.users as AdminUser[])).catch((e) => setNote(`Could not load users: ${e.message}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  const act = async (u: AdminUser, action: 'block' | 'unblock' | 'delete') => {
    if (action === 'delete' && window.prompt(`This permanently deletes ${u.email} and all their data. Type DELETE to confirm.`) !== 'DELETE') return;
    if (action === 'block' && !window.confirm(`Block ${u.email} from signing in?`)) return;
    setBusy(u.id);
    try {
      await call({ action, id: u.id });
      setNote(`${action === 'delete' ? 'Deleted' : action === 'block' ? 'Blocked' : 'Unblocked'} ${u.email}.`);
      await load();
    } catch (e) {
      setNote(`Could not ${action}: ${(e as Error).message}`);
    } finally {
      setBusy('');
    }
  };

  const shown = (users ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="card !p-4" aria-labelledby="users-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="users-h" className="font-display text-xl font-bold">Users {users && <span className="font-sans text-base font-normal text-muted">({fmt(users.length)})</span>}</h2>
        <input className="field !min-h-[40px] max-w-xs" placeholder="Search name or email" aria-label="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {note && <p role="status" className="mt-2 rounded-xl bg-indigo-soft p-2 text-sm">{note}</p>}
      {!users ? <Spinner label="Loading users" /> : (
        <ul className="mt-3 divide-y divide-line/70">
          {shown.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3" data-testid="admin-user">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold">{u.name || '(no name)'} <span className="font-normal text-muted">{u.email}</span></p>
                <p className="text-xs text-muted">
                  Joined {day(u.created_at)} · last seen {day(u.last_sign_in_at)} · {u.language ? (LANG_NAME[u.language] ?? u.language) : 'no language'}{u.onboarded ? '' : ' · setup not finished'}
                </p>
                <p className="text-xs" data-testid="admin-activity">
                  <span className="font-semibold">{fmt(u.days_analysed)}</span> days analysed ({fmt(u.analysed_7d)} in 7 days, last {day(u.last_analysed_at)}) ·{' '}
                  <span className="font-semibold text-good">{fmt(u.punya_acts)}</span> punya acts · <span className="font-semibold text-paapred">{fmt(u.paap_acts)}</span> to reflect on
                </p>
              </div>
              {u.admin && <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-saffron-text">Admin</span>}
              {u.blocked && <span className="rounded-full bg-indigo-soft px-2 py-0.5 text-xs font-semibold text-paapred">Blocked</span>}
              {!u.admin && (
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost !min-h-[40px] !px-3 text-sm" disabled={busy === u.id} onClick={() => act(u, u.blocked ? 'unblock' : 'block')}>{u.blocked ? 'Unblock' : 'Block'}</button>
                  <button type="button" className="btn-ghost !min-h-[40px] !px-3 text-sm text-paapred" disabled={busy === u.id} onClick={() => act(u, 'delete')}>Delete</button>
                </div>
              )}
            </li>
          ))}
          {shown.length === 0 && <li className="py-3 text-muted">No users match.</li>}
        </ul>
      )}
    </section>
  );
}

/** Admin numbers: counts only, no names, emails or diary text. Allowed only for emails in the `admins` table. */
export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (!supabase) {
      setProblem('The admin panel needs the live Supabase project; it is not available in demo mode.');
      return;
    }
    supabase.rpc('admin_stats').then(({ data, error }) => {
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
      <header>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted">Numbers and the user list. Diary messages, acts and points are never shown here: they stay private to each user.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile testId="adm-users" label="Registered users" value={stats.users_total} sub={`${fmt(stats.onboarded)} finished setup`} />
        <Tile testId="adm-new" label="New today" value={stats.users_today} sub={`${fmt(stats.users_7d)} in the last 7 days`} />
        <Tile testId="adm-visitors" label="Visitors" value={stats.visitors_total} sub={`${fmt(stats.visitors_today)} new today`} />
        <Tile testId="adm-active" label="Active in 7 days" value={stats.active_7d} sub="people who said their day" />
        <Tile testId="adm-analyses" label="Days analysed" value={stats.analyses_total} sub={`${fmt(stats.analyses_today)} today`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
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

      <Users />
    </div>
  );
}
