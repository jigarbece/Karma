import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays, netSeries, rangeDays, streak as calcStreak, totalsForRange } from '../lib/ghada';
import { formatTithi, tithiForNow } from '../lib/panchang';
import { getTeaching } from '../lib/teachings';
import type { Range } from '../lib/types';
import type { DayReflection } from '../lib/repo';
import { GhadaPair } from '../components/GhadaPair';
import { NetPill } from '../components/NetPill';
import { MicButton } from '../components/MicButton';
import { Mandala } from '../components/Mandala';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/ui';

const WeekChart = lazy(() => import('../components/WeekChart'));

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
  const streakN = calcStreak(actions, today);
  const isNew = actions.every((a) => a.type === 'neutral');

  const teaching = getTeaching(reflection?.teaching_id);
  const greeting = t(`greeting.${profile?.greeting ?? 'namaste'}`);
  const rangeLabel = range === 'today' ? t('home.net_today') : t('home.net_range');

  return (
    <div className="space-y-5">
      {demo && <p className="rounded-2xl bg-indigo-soft px-4 py-2 text-sm text-indigo">{t('common.demo')}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-6">
        {/* Sacred hero: greeting, tithi and the two ghadas */}
        <section className="panel-night p-5 lg:p-8" aria-label="Ghadas">
          <Mandala className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 text-gold-light opacity-[0.14]" />
          <header className="relative">
            <h1 className="text-4xl leading-tight text-cream lg:text-5xl">
              {t('home.greeting', { greeting, name: profile?.name || '' }).replace(/, $/, '')}
            </h1>
            <p className="mt-1 text-cream/85 lg:text-lg">
              {date(today)}
              {tithi && (
                <>
                  {' · '}
                  <span className="font-display text-xl text-gold-light lg:text-2xl" data-testid="tithi">{tithi}</span>
                </>
              )}
            </p>
            {streakN > 0 && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold-light/30 bg-white/10 px-3 py-1 text-sm font-semibold text-gold-light">
                <Icon name="krodh" size={16} />
                {t('home.streak', { n: num(streakN) })}
              </p>
            )}
          </header>

          <div className="relative mt-5">
            <Segmented
              tone="night"
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

          <div className="relative mt-5">
            <GhadaPair punya={totals.punya} paap={totals.paap} range={range} tone="night" />
            <div className="mt-4">
              <NetPill tone="night" net={totals.net} label={rangeLabel} trend={trend} />
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {/* Mic call-to-action */}
          <section className="panel-saffron flex flex-col items-center gap-3 p-6 text-center">
            <MicButton size="lg" label={t('home.mic_title')} onClick={() => navigate('/talk?mic=1')} />
            <div className="mt-2">
              <h2 className="font-display text-3xl font-bold leading-tight">{t('home.mic_title')}</h2>
              <p className="mt-1 opacity-80">{isNew ? t('home.empty_body') : t('home.mic_sub')}</p>
            </div>
            <Link to="/talk" className="inline-flex min-h-[44px] items-center font-semibold underline underline-offset-4">{t('nav.talk')}</Link>
          </section>

          {/* Teaching */}
          <section className="card" aria-labelledby="refl">
            <h2 id="refl" className="text-lg font-bold">{t('home.reflection')}</h2>
            {teaching && reflection ? (
              <div className="mt-3 space-y-3">
                <blockquote className="relative border-l-4 border-saffron pl-4 font-display text-2xl leading-relaxed">
                  <span aria-hidden="true" className="absolute -top-3 right-0 text-6xl text-gold/30">”</span>
                  {teaching.text[lang]}
                  <footer className="mt-2 font-sans text-sm text-muted">— {teaching.source}</footer>
                </blockquote>
                {reflection.suggestion && (
                  <p className="rounded-2xl bg-saffron/15 p-3">
                    <span className="font-semibold text-saffron-text">{t('home.suggestion')}: </span>
                    {reflection.suggestion}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-muted">{t('home.reflection_empty')}</p>
            )}
          </section>

          {/* Weekly trend */}
          <section className="card" aria-labelledby="wk">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="wk" className="text-lg font-bold">{t('home.week_chart')}</h2>
              <span className={`text-sm font-semibold ${delta < 0 ? 'text-indigo' : 'text-saffron-text'}`}>{t('home.vs_last_week', { delta: deltaText })}</span>
            </div>
            {isNew ? (
              <p className="mt-3 text-muted">{t('home.chart_empty')}</p>
            ) : (
              <div className="mt-2 h-44 lg:h-56" role="img" aria-label={`${t('home.week_chart')}: ${series.map((s) => `${s.label} ${s.net}`).join(', ')}`}>
                <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-line/50" />}>
                  <WeekChart data={series} />
                </Suspense>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
