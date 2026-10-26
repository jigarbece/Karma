import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays, netSeries, rangeDays, totalsForRange } from '../lib/ghada';
import { formatTithi, tithiForNow } from '../lib/panchang';
import { getTeaching } from '../lib/teachings';
import type { Range } from '../lib/types';
import type { DayReflection } from '../lib/repo';
import { GhadaPair } from '../components/GhadaPair';
import { NetPill } from '../components/NetPill';
import { MicButton } from '../components/MicButton';
import { Segmented } from '../components/ui';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { profile, actions, today, repo, demo } = useApp();
  const { t, num, date, lang } = useI18n();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('today');
  const [reflection, setReflection] = useState<DayReflection | null>(null);

  useEffect(() => {
    let live = true;
    repo?.getReflection(today).then((r) => live && setReflection(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repo, today, actions.length]);

  const tithi = useMemo(() => {
    try {
      return formatTithi(tithiForNow(new Date()), lang);
    } catch {
      return '';
    }
    // `today` re-computes the tithi after midnight in a long-lived session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, today]);

  const totals = totalsForRange(actions, range, today);
  const days = rangeDays(range);
  const prev = days ? totalsForRange(actions, range, addDays(today, -days)) : null;
  const trend = prev ? totals.net - prev.net : totals.net;

  const series = netSeries(actions, today, 7).map((d) => ({ ...d, label: date(d.date, { weekday: 'short' }) }));
  const thisWeek = totalsForRange(actions, 'week', today).net;
  const lastWeek = totalsForRange(actions, 'week', addDays(today, -7)).net;
  const delta = thisWeek - lastWeek;
  const deltaText = `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${num(Math.abs(delta))}`;

  const teaching = getTeaching(reflection?.teaching_id);
  const greeting = t(`greeting.${profile?.greeting ?? 'namaste'}`);
  const rangeLabel = range === 'today' ? t('home.net_today') : t('home.net_range');

  return (
    <div className="space-y-5">
      {demo && <p className="rounded-xl bg-indigo-soft px-3 py-2 text-sm text-indigo">{t('common.demo')}</p>}

      <header>
        <h1 className="text-2xl font-bold">{t('home.greeting', { greeting, name: profile?.name || '' }).replace(/, $/, '')}</h1>
        <p className="text-muted">
          {date(today)}
          {tithi && (
            <>
              {' · '}
              <span className="font-serif text-saffron-text" data-testid="tithi">{tithi}</span>
            </>
          )}
        </p>
      </header>

      <div className="lg:max-w-lg">
      <Segmented
        label={t('home.range_label')}
        value={range}
        onChange={setRange}
        options={[
          { value: 'today', label: t('common.today') },
          { value: 'week', label: t('common.week') },
          { value: 'month', label: t('common.month') },
          { value: 'lifetime', label: t('common.lifetime') },
        ]}
      />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="space-y-5">
      <section aria-label="Ghadas" className="card !px-2">
        <GhadaPair punya={totals.punya} paap={totals.paap} range={range} />
        <div className="mt-3">
          <NetPill net={totals.net} label={rangeLabel} trend={trend} />
        </div>
      </section>

      <section className="card flex flex-col items-center gap-3 text-center">
        <MicButton size="lg" label={t('home.mic_title')} onClick={() => navigate('/talk?mic=1')} />
        <div>
          <h2 className="text-lg font-bold">{t('home.mic_title')}</h2>
          <p className="text-muted">{t('home.mic_sub')}</p>
        </div>
        <Link to="/talk" className="text-sm font-semibold text-saffron-text underline">{t('nav.talk')}</Link>
      </section>
      </div>

      <div className="space-y-5">
      <section className="card" aria-labelledby="refl">
        <h2 id="refl" className="text-lg font-bold">{t('home.reflection')}</h2>
        {teaching && reflection ? (
          <div className="mt-2 space-y-3">
            <blockquote className="border-l-4 border-saffron pl-3 font-serif text-lg leading-relaxed">
              {teaching.text[lang]}
              <footer className="mt-1 font-sans text-sm text-muted">— {teaching.source}</footer>
            </blockquote>
            {reflection.suggestion && (
              <p className="rounded-xl bg-saffron/15 p-3">
                <span className="font-semibold text-saffron-text">{t('home.suggestion')}: </span>
                {reflection.suggestion}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-muted">{t('home.reflection_empty')}</p>
        )}
      </section>

      <section className="card" aria-labelledby="wk">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="wk" className="text-lg font-bold">{t('home.week_chart')}</h2>
          <span className={`text-sm font-semibold ${delta < 0 ? 'text-indigo' : 'text-saffron-text'}`}>{t('home.vs_last_week', { delta: deltaText })}</span>
        </div>
        <div className="mt-2 h-44 lg:h-60" role="img" aria-label={`${t('home.week_chart')}: ${series.map((s) => `${s.label} ${s.net}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="net" stroke="rgb(var(--saffron))" strokeWidth={3} dot={{ r: 4, fill: 'rgb(var(--gold))' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>
      </div>
    </div>
  );
}
