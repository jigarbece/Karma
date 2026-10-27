import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays, netSeries, rangeDays, streak as calcStreak, totalsForRange } from '../lib/ghada';
import { useTithi } from '../lib/useTithi';
import { dailyTeaching, getTeaching } from '../lib/teachings';
import type { Range } from '../lib/types';
import type { DayReflection } from '../lib/repo';
import { GhadaPair } from '../components/GhadaPair';
import { NetCard } from '../components/NetCard';
import { MicButton } from '../components/MicButton';
import { HeroScene } from '../components/HeroScene';
import { InsightArt, Waveform } from '../components/InsightArt';
import { Icon } from '../components/Icon';
import { LotusDivider } from '../components/Mandala';
import { Segmented } from '../components/ui';

const WeekChart = lazy(() => import('../components/WeekChart'));

const QUICK = [
  { key: 'qa.good', icon: 'sparkle', topic: 'good', tint: 'bg-gold/20 text-saffron-text' },
  { key: 'qa.mistake', icon: 'alert', topic: 'mistake', tint: 'bg-good/15 text-good' },
  { key: 'qa.gratitude', icon: 'heart', topic: 'gratitude', tint: 'bg-[#E5483B]/12 text-[#C9372B]' },
  { key: 'qa.journal', icon: 'pen', topic: '', tint: 'bg-indigo-soft text-indigo' },
] as const;

export default function Home() {
  const { profile, actions, today, repo, demo } = useApp();
  const { t, num, date, lang } = useI18n();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('today');
  const [reflection, setReflection] = useState<DayReflection | null>(null);
  const tithi = useTithi(lang, today);

  useEffect(() => {
    let live = true;
    repo?.getReflection(today).then((r) => live && setReflection(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repo, today, actions.length]);

  const totals = totalsForRange(actions, range, today);
  const days = rangeDays(range);
  const prev = days ? totalsForRange(actions, range, addDays(today, -days)) : null;
  const trend = prev ? totals.net - prev.net : totals.net;

  const series = netSeries(actions, today, 7).map((d) => ({ label: date(d.date, { day: 'numeric', month: 'short' }), net: d.net, punya: d.punya, paap: -d.paap }));
  const lastNet = series[series.length - 1]?.net ?? 0;
  const thisWeek = totalsForRange(actions, 'week', today).net;
  const lastWeek = totalsForRange(actions, 'week', addDays(today, -7)).net;
  const delta = thisWeek - lastWeek;
  const deltaText = `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${num(Math.abs(delta))}`;
  const streakN = calcStreak(actions, today);
  const isNew = actions.every((a) => a.type === 'neutral');

  const tradition = profile?.tradition ?? 'general';
  const reflected = getTeaching(reflection?.teaching_id);
  const heroQuote = reflected ?? dailyTeaching(today, tradition);
  const greeting = t(`greeting.${profile?.greeting ?? 'namaste'}`);
  const rangeLabel = range === 'today' ? t('home.net_today') : t('home.net_range');

  return (
    <div className="space-y-5">
      {demo && <p className="rounded-2xl bg-indigo-soft px-4 py-2 text-sm text-indigo">{t('common.demo')}</p>}

      {/* Sunrise hero: greeting, tithi, the two ghadas and today's net */}
      <section className="hero-card" aria-label="Ghadas">
        <HeroScene className="absolute inset-0 -z-0 h-full w-full" />
        <div className="hero-scrim absolute inset-0 lg:bg-[linear-gradient(90deg,rgb(var(--scrim)/0.88)_0%,rgb(var(--scrim)/0.5)_34%,transparent_64%)]" />
        <div className="relative grid gap-5 p-4 sm:p-6 lg:min-h-[500px] lg:grid-cols-[1fr_1.45fr_0.95fr] lg:items-stretch lg:gap-4 lg:p-8">
          <div className="flex flex-col">
            <h1 className="text-4xl leading-[1.1] lg:text-5xl">
              {t('home.greeting', { greeting, name: profile?.name || '' }).replace(/, $/, '')} 🙏
            </h1>
            <p className="mt-2 text-lg">
              {tithi && <span className="font-display text-xl font-semibold" data-testid="tithi">{tithi}</span>}
              {tithi && <span className="mx-3 opacity-50">|</span>}
              <span>{date(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
            {streakN > 0 && (
              <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-white/60 px-3 py-1 text-sm font-semibold backdrop-blur">
                <Icon name="krodh" size={16} className="text-saffron-text" />
                {t('home.streak', { n: num(streakN) })}
              </p>
            )}
            <div className="mt-4 max-w-sm">
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
            <blockquote className="mt-auto hidden pt-8 lg:block">
              <p className="font-display text-2xl italic leading-snug">“{heroQuote.sa ?? heroQuote.text[lang]}”</p>
              <footer className="mt-2 text-sm opacity-80">— {heroQuote.source}</footer>
            </blockquote>
          </div>

          <div className="self-end">
            <GhadaPair punya={totals.punya} paap={totals.paap} range={range} />
          </div>

          <div className="self-end lg:pb-2">
            <NetCard net={totals.net} label={rangeLabel} trend={trend} />
          </div>
        </div>
      </section>

      {/* Mic + quick actions */}
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <section className="panel-saffron flex items-center justify-between gap-2 px-3 py-6 sm:px-8">
          <Waveform className="hidden h-16 w-36 shrink-0 sm:block lg:w-48" />
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <MicButton size="lg" label={t('home.mic_title')} onClick={() => navigate('/talk?mic=1')} />
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight text-[#B4400A] lg:text-4xl">{t('home.mic_title')}</h2>
              <p className="mt-1 text-lg">{isNew ? t('home.empty_body') : t('home.tap_tell')}</p>
            </div>
          </div>
          <Waveform mirror className="hidden h-16 w-36 shrink-0 sm:block lg:w-48" />
        </section>

        <section className="card" aria-labelledby="qa">
          <h2 id="qa" className="flex items-center gap-2 font-display text-2xl font-bold">
            <Icon name="sparkle" size={22} className="text-saffron-text" />
            {t('home.quick_actions')}
          </h2>
          <ul className="mt-4 grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <li key={q.key}>
                <Link
                  to={q.topic ? `/talk?topic=${q.topic}` : '/journal'}
                  className="flex min-h-[44px] flex-col items-center gap-2 rounded-2xl p-1 text-center text-sm font-medium hover:bg-sand/50"
                >
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl ${q.tint}`}><Icon name={q.icon} size={26} /></span>
                  {t(q.key)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Reflection, journey chart, daily insight */}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1.25fr_0.9fr]">
        <section className="card" aria-labelledby="refl">
          <div className="flex items-center justify-between gap-2">
            <h2 id="refl" className="flex items-center gap-2 font-display text-2xl font-bold">
              <Icon name="lotus" size={22} className="text-saffron-text" />
              {t('home.reflection')}
            </h2>
            <Link to="/wisdom/all" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-saffron-text">
              {t('home.view_more')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {reflected && reflection ? (
            <div className="mt-2 space-y-3">
              <blockquote>
                {reflected.sa && <p className="font-display text-2xl leading-snug">“{reflected.sa}”</p>}
                <p className={reflected.sa ? 'mt-1 text-base text-muted' : 'font-display text-2xl leading-snug'}>
                  {reflected.sa ? `(${reflected.text[lang]})` : `“${reflected.text[lang]}”`}
                </p>
                <footer className="mt-2 text-sm text-muted">— {reflected.source}</footer>
              </blockquote>
              {reflection.suggestion && (
                <div className="flex gap-3 rounded-2xl bg-saffron/15 p-3">
                  <Icon name="sparkle" size={22} className="mt-0.5 shrink-0 text-saffron-text" />
                  <p>
                    <span className="font-semibold text-saffron-text">{t('home.suggestion')}</span>
                    <br />
                    {reflection.suggestion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-muted">{t('home.reflection_empty')}</p>
          )}
        </section>

        <section className="card" aria-labelledby="wk">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="wk" className="flex items-center gap-2 font-display text-2xl font-bold">
              <Icon name="chart" size={22} className="text-saffron-text" />
              {t('home.journey')}
              <span className="font-sans text-sm font-normal text-muted">{t('home.last7')}</span>
            </h2>
            {!isNew && <span className="rounded-full bg-good/15 px-3 py-0.5 text-sm font-bold text-good">{lastNet > 0 ? '+' : ''}{num(lastNet)}</span>}
          </div>
          {isNew ? (
            <p className="mt-3 text-muted">{t('home.chart_empty')}</p>
          ) : (
            <>
              <div className="mt-2 h-56" role="img" aria-label={`${t('home.journey')}: ${series.map((s) => `${s.label} ${s.net}`).join(', ')}`}>
                <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-line/50" />}>
                  <WeekChart data={series} names={{ net: t('home.legend_net'), punya: t('common.punya'), paap: t('common.paap') }} />
                </Suspense>
              </div>
              <p className={`mt-1 text-sm font-semibold ${delta < 0 ? 'text-indigo' : 'text-good'}`}>{t('home.vs_last_week', { delta: deltaText })}</p>
            </>
          )}
        </section>

        <section className="card overflow-hidden !p-0" aria-labelledby="ins">
          <div className="p-5 pb-3">
            <h2 id="ins" className="flex items-center gap-2 font-display text-2xl font-bold">
              <Icon name="sparkle" size={22} className="text-saffron-text" />
              {t('home.daily_insight')}
            </h2>
          </div>
          <InsightArt className="h-32 w-full" />
          <p className="space-y-0.5 p-5 pt-3 text-[0.98rem] leading-relaxed">
            {t('home.insight_1')}<br />{t('home.insight_2')}<br />{t('home.insight_3')}
          </p>
        </section>
      </div>

      {/* Phones: the sidebar pages live here */}
      <section className="lg:hidden" aria-label={t('home.explore')}>
        <LotusDivider className="mb-4" />
        <ul className="grid grid-cols-2 gap-3">
          {[
            ['/wisdom/gita', 'nav.gita', 'book'],
            ['/wisdom/jain', 'nav.jain', 'lotus'],
            ['/goals', 'nav.goals', 'goal'],
            ['/awards', 'nav.awards', 'trophy'],
            ['/journal', 'nav.journal', 'pen'],
          ].map(([to, key, icon]) => (
            <li key={to}>
              <Link to={to} className="card flex min-h-[56px] items-center gap-3 !p-3 font-semibold">
                <Icon name={icon} className="text-saffron-text" />
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
