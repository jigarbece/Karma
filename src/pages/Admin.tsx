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
        <p className="text-muted">Counts only. No names, emails, messages or acts are shown here.</p>
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
    </div>
  );
}
