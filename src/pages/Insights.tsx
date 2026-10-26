import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays, netSeries, signedWeight, streak, summarizeByDay, totalsForRange } from '../lib/ghada';
import { CATEGORIES, GOAL_CATEGORIES, type Category } from '../lib/types';
import { Icon, CATEGORY_ICON } from '../components/Icon';
import { PageTitle, Segmented } from '../components/ui';

type Span = 'week' | 'month' | 'year';
const tick = { fill: 'rgb(var(--muted))', fontSize: 12 };

export default function Insights() {
  const { actions, today, profile } = useApp();
  const { t, num, date } = useI18n();
  const [span, setSpan] = useState<Span>('month');

  const byCat = useMemo(() => {
    const m = new Map<Category, { punya: number; paap: number; net: number }>();
    for (const c of CATEGORIES) m.set(c, { punya: 0, paap: 0, net: 0 });
    for (const a of actions) {
      if (a.type === 'neutral') continue;
      const w = signedWeight(a);
      const r = m.get(a.category)!;
      if (w > 0) r.punya += w;
      else r.paap += -w;
      r.net += w;
    }
    return m;
  }, [actions]);

  const hasData = actions.some((a) => a.type !== 'neutral');
  if (!hasData) {
    return (
      <div>
        <PageTitle>{t('insights.title')}</PageTitle>
        <p className="card text-muted">{t('insights.empty')}</p>
      </div>
    );
  }

  const history = netSeries(actions, today, 14).map((d) => ({ ...d, label: date(d.date, { day: 'numeric', month: 'short' }), paap: -d.paap }));

  const trend = (() => {
    if (span === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const end = addDays(today, -(11 - i) * 30);
        const from = addDays(end, -29);
        const net = actions.filter((a) => a.date >= from && a.date <= end).reduce((s, a) => s + signedWeight(a), 0);
        return { label: date(end, { month: 'short' }), net };
      });
    }
    const n = span === 'week' ? 7 : 30;
    return netSeries(actions, today, n).map((d) => ({ label: date(d.date, span === 'week' ? { weekday: 'short' } : { day: 'numeric' }), net: d.net }));
  })();

  const radar = CATEGORIES.map((c) => ({ cat: t(`cat.${c}`), punya: byCat.get(c)!.punya, growth: byCat.get(c)!.paap }));

  const ranked = [...byCat.entries()].map(([c, v]) => ({ c, ...v }));
  const strengths = ranked.filter((r) => r.net > 0).sort((a, b) => b.net - a.net).slice(0, 3);
  const growth = ranked.filter((r) => r.paap > 0).sort((a, b) => b.paap - a.paap || a.net - b.net).slice(0, 3);

  const streakN = streak(actions, today);

  // heatmap: last 12 weeks, columns = weeks, rows = Mon..Sun
  const dayMap = summarizeByDay(actions);
  const end = new Date(`${today}T00:00:00Z`);
  const dow = (end.getUTCDay() + 6) % 7; // Monday = 0
  const weeks = 12;
  const start = addDays(today, -(weeks * 7 - 1) - 0 + (6 - dow));
  const cells: Array<{ date: string; net: number | null; future: boolean }> = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    cells.push({ date: d, net: dayMap.get(d)?.net ?? null, future: d > today });
  }
  const maxAbs = Math.max(5, ...cells.map((c) => Math.abs(c.net ?? 0)));
  const cellStyle = (net: number | null) => {
    if (net === null) return { background: 'rgb(var(--line) / 0.5)' };
    const a = 0.25 + 0.75 * Math.min(1, Math.abs(net) / maxAbs);
    return { background: net >= 0 ? `rgb(var(--gold) / ${a})` : `rgb(var(--indigo) / ${a})` };
  };

  const goals = (profile?.goals ?? []).map((g) => {
    const cats = GOAL_CATEGORIES[g];
    const from = addDays(today, -6);
    const net = actions.filter((a) => a.date >= from && cats.includes(a.category)).reduce((s, a) => s + signedWeight(a), 0);
    return { g, net, pct: Math.max(0, Math.min(100, Math.round((net / 10) * 100))) };
  });

  const week = totalsForRange(actions, 'week', today);

  const side = (
    <div className="space-y-5">
      <section className="card flex items-center gap-4" aria-label={t('insights.streak')}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-saffron/25 text-saffron-text"><Icon name="krodh" size={30} /></span>
        <div>
          <div className="text-sm text-muted">{t('insights.streak')}</div>
          <div className="text-2xl font-bold" data-testid="streak">{t('insights.streak_days', { n: num(streakN) })}</div>
          <div className="text-sm text-muted">{t('home.net_range')} ({t('common.week')}): {week.net >= 0 ? '+' : '−'}{num(Math.abs(week.net))}</div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold">{t('insights.strengths')}</h2>
        <ol className="mt-2 space-y-2">
          {strengths.length === 0 && <li className="text-muted">{t('common.none_yet')}</li>}
          {strengths.map((s, i) => (
            <li key={s.c} className="flex items-center gap-3">
              <span className="w-5 font-bold text-saffron-text">{num(i + 1)}</span>
              <Icon name={CATEGORY_ICON[s.c]} className="text-saffron-text" />
              <span className="flex-1">{t(`cat.${s.c}`)}</span>
              <span className="font-bold text-saffron-text">+{num(s.net)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold">{t('insights.growth')}</h2>
        <ol className="mt-2 space-y-2">
          {growth.length === 0 && <li className="text-muted">{t('common.none_yet')}</li>}
          {growth.map((s, i) => (
            <li key={s.c} className="flex items-center gap-3">
              <span className="w-5 font-bold text-indigo">{num(i + 1)}</span>
              <Icon name={CATEGORY_ICON[s.c]} className="text-indigo" />
              <span className="flex-1">{t(`cat.${s.c}`)}</span>
              <span className="font-bold text-indigo">−{num(s.paap)}</span>
            </li>
          ))}
        </ol>
      </section>

      {goals.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold">{t('insights.goals')}</h2>
          <ul className="mt-2 space-y-3">
            {goals.map((g) => (
              <li key={g.g}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{t(`goal.${g.g}`)}</span>
                  <span className="text-muted">{t('insights.goal_progress', { n: `${g.net >= 0 ? '+' : '−'}${num(Math.abs(g.net))}` })}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.pct} aria-label={t(`goal.${g.g}`)}>
                  <div className="h-full rounded-full bg-saffron" style={{ width: `${g.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  return (
    <div>
      <PageTitle>{t('insights.title')}</PageTitle>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <div className="lg:hidden">{side}</div>

          <section className="card">
            <h2 className="text-lg font-bold">{t('insights.history')}</h2>
            <div className="mt-2 h-52" role="img" aria-label={t('insights.history')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} stackOffset="sign" margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={tick} interval={1} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="punya" name={t('common.punya')} stackId="a" fill="rgb(var(--gold))" isAnimationActive={false} />
                  <Bar dataKey="paap" name={t('common.paap')} stackId="a" fill="rgb(var(--indigo))" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t('insights.trend')}</h2>
            </div>
            <div className="mt-2">
              <Segmented label={t('insights.trend')} value={span} onChange={setSpan} options={[
                { value: 'week', label: t('common.week') }, { value: 'month', label: t('common.month') }, { value: 'year', label: t('common.year') },
              ]} />
            </div>
            <div className="mt-3 h-52" role="img" aria-label={t('insights.trend')}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="net" name={t('common.net')} stroke="rgb(var(--saffron))" strokeWidth={3} dot={span !== 'month'} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold">{t('insights.radar')}</h2>
            <div className="mt-2 h-72" role="img" aria-label={t('insights.radar')}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="68%">
                  <PolarGrid stroke="rgb(var(--line))" />
                  <PolarAngleAxis dataKey="cat" tick={{ ...tick, fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name={t('common.punya')} dataKey="punya" stroke="rgb(var(--gold))" fill="rgb(var(--gold))" fillOpacity={0.35} isAnimationActive={false} />
                  <Radar name={t('common.growth_area')} dataKey="growth" stroke="rgb(var(--indigo))" fill="rgb(var(--indigo))" fillOpacity={0.25} strokeDasharray="4 3" isAnimationActive={false} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-bold">{t('insights.heatmap')}</h2>
            <div className="mt-3 overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }} role="grid" aria-label={t('insights.heatmap')}>
                {cells.map((c) => (
                  <div
                    key={c.date}
                    role="gridcell"
                    title={`${c.date}: ${c.net ?? 0}`}
                    aria-label={`${date(c.date, { day: 'numeric', month: 'short' })}: ${c.net === null ? t('talk.type_neutral') : c.net}`}
                    className={`grid h-7 w-7 place-items-center rounded-md text-[10px] font-bold text-ink ${c.future ? 'opacity-20' : ''}`}
                    style={cellStyle(c.net)}
                  >
                    {c.net === null ? '' : c.net > 0 ? `+${c.net}` : c.net}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">{t('insights.heat_legend')}</p>
          </section>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-4">{side}</div></aside>
      </div>
    </div>
  );
}
