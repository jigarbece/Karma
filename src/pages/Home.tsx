import { useCallback, useRef, useState } from 'react';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { RateLimitError, AnalyzeError, type AnalyzeResponse } from '../lib/repo';
import { getTeaching } from '../lib/teachings';
import { totalsForRange, addDays, rangeDays } from '../lib/ghada';
import { useSpeech } from '../lib/useSpeech';
import { useTithi } from '../lib/useTithi';
import type { Range } from '../lib/types';
import { GhadaPair } from '../components/GhadaPair';
import { NetPill } from '../components/NetPill';
import { MicButton } from '../components/MicButton';
import { Disagree } from '../components/Disagree';
import { Icon } from '../components/Icon';
import { ActionCard, Segmented, Spinner } from '../components/ui';

/** The whole product on one screen: say your day, see two pots, read what each act was worth. */
export default function Home() {
  const { t, num, date, lang } = useI18n();
  const { profile, actions, today, repo, refresh, demo } = useApp();
  const [range, setRange] = useState<Range>('today');
  const [text, setText] = useState('');
  const textRef = useRef('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState('');
  const tithi = useTithi(lang, today);

  const setBoth = useCallback((v: string) => {
    textRef.current = v;
    setText(v);
  }, []);
  const getBase = useCallback(() => textRef.current, []);
  const speech = useSpeech(lang, getBase, setBoth);

  const analyse = async () => {
    if (!repo || !text.trim()) return;
    if (speech.listening) speech.stop();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const r = await repo.analyze({ transcript: text.trim(), date: today, language: lang });
      setResult(r);
      if (!r.safety_flag) {
        setBoth('');
        await refresh();
      }
    } catch (e) {
      setError(
        e instanceof RateLimitError
          ? t('talk.limit', { n: e.limit })
          : e instanceof AnalyzeError
            ? `${t('common.error')} (${e.code}${e.detail ? `: ${e.detail}` : ''})`
            : t('common.error'),
      );
    } finally {
      setBusy(false);
    }
  };

  const totals = totalsForRange(actions, range, today);
  const days = rangeDays(range);
  const prev = days ? totalsForRange(actions, range, addDays(today, -days)) : null;
  const trend = prev ? totals.net - prev.net : totals.net;
  const todays = actions.filter((a) => a.date === today && a.type !== 'neutral').sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const greeting = t(`greeting.${profile?.greeting ?? 'namaste'}`);
  const teaching = getTeaching(result?.reflection?.teaching_id);

  return (
    <div className="space-y-5">
      {demo && <p className="rounded-2xl bg-indigo-soft px-4 py-2 text-sm text-indigo">{t('common.demo')}</p>}

      <header>
        <h1 className="text-4xl leading-tight lg:text-5xl">
          {t('home.greeting', { greeting, name: profile?.name || '' }).replace(/, $/, '')} 🙏
        </h1>
        <p className="mt-1 text-lg text-muted">
          {tithi && <span className="font-display text-xl font-semibold text-saffron-text" data-testid="tithi">{tithi}</span>}
          {tithi && <span className="mx-3 opacity-50">|</span>}
          {date(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-6">
        {/* The two pots */}
        <section className="sunrise-card space-y-4 p-4 sm:p-6 lg:sticky lg:top-24" aria-label="Ghadas">
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
          <GhadaPair punya={totals.punya} paap={totals.paap} range={range} />
          <NetPill net={totals.net} label={range === 'today' ? t('home.net_today') : t('home.net_range')} trend={trend} />
        </section>

        <div className="space-y-5">
          {/* Say your day */}
          <section className="card space-y-3" aria-labelledby="say">
            <h2 id="say" className="font-display text-3xl font-bold leading-tight">{t('home.mic_title')}</h2>
            <label htmlFor="story" className="sr-only">{t('home.mic_title')}</label>
            <textarea
              id="story" rows={5} className="field resize-y" placeholder={t('talk.placeholder')} value={text}
              onChange={(e) => setBoth(e.target.value)} maxLength={4000} lang={lang}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {speech.supported && (
                  <MicButton size="md" active={speech.listening} onClick={speech.listening ? speech.stop : speech.start} label={speech.listening ? t('talk.listening') : t('talk.hold')} />
                )}
                <p className="text-sm text-muted" aria-live="polite">
                  {!speech.supported ? t('talk.voice_unsupported') : speech.listening ? t('talk.listening') : speech.error ? t('talk.voice_error') : t('talk.hold')}
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={analyse} disabled={busy || !text.trim()}>{t('talk.analyse')}</button>
            </div>
            {busy && <Spinner label={t('talk.analysing')} />}
            {error && <p role="alert" className="rounded-xl bg-indigo-soft p-3 text-sm font-semibold text-indigo">{error}</p>}
          </section>

          {result?.safety_flag && (
            <section role="alert" className="card border-saffron-text bg-saffron/10">
              <h2 className="text-lg font-bold">{t('talk.safety.title')}</h2>
              <p className="mt-2">{t('talk.safety.body')}</p>
              <a href="tel:14416" className="btn-primary mt-3 w-full"><Icon name="phone" size={20} />{t('talk.safety.call')}</a>
            </section>
          )}

          {result && !result.safety_flag && result.actions.length === 0 && <p className="card text-muted">{t('talk.nothing_scored')}</p>}

          {result && !result.safety_flag && teaching && result.reflection && (
            <section className="card" aria-live="polite">
              <h2 className="font-display text-2xl font-bold">{t('talk.reflection')}</h2>
              <blockquote className="mt-2 border-l-4 border-saffron pl-3 font-display text-xl leading-relaxed">
                {teaching.text[lang]}
                <footer className="mt-1 font-sans text-sm text-muted">— {teaching.source}</footer>
              </blockquote>
              {result.reflection.suggestion && (
                <p className="mt-3 rounded-2xl bg-saffron/15 p-3">
                  <span className="font-semibold text-saffron-text">{t('home.suggestion')}: </span>
                  {result.reflection.suggestion}
                </p>
              )}
            </section>
          )}

          {/* What each act was worth */}
          <section aria-labelledby="acts">
            <h2 id="acts" className="mb-2 font-display text-2xl font-bold">
              {t('talk.today_entries')} <span className="font-sans text-base font-normal text-muted">({num(todays.length)})</span>
            </h2>
            {todays.length === 0 ? (
              <p className="text-muted">{t('talk.no_entries')}</p>
            ) : (
              <ul className="space-y-3">
                {todays.map((a) => (
                  <ActionCard key={a.id} a={a}>
                    <Disagree actionId={a.id} />
                  </ActionCard>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
