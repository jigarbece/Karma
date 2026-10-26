import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { AnalyzeError, RateLimitError, type AnalyzeResponse } from '../lib/repo';
import { getTeaching } from '../lib/teachings';
import { totalsForRange } from '../lib/ghada';
import { useSpeech } from '../lib/useSpeech';
import type { Entry } from '../lib/types';
import { GhadaPair } from '../components/GhadaPair';
import { MicButton } from '../components/MicButton';
import { NetPill } from '../components/NetPill';
import { ActionCard, PageTitle, Spinner } from '../components/ui';
import { Icon } from '../components/Icon';

function Disagree({ actionId }: { actionId: string }) {
  const { t } = useI18n();
  const { repo } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) return <p role="status" className="mt-2 text-sm text-saffron-text">{t('talk.feedback_thanks')}</p>;
  if (!open) {
    return (
      <button type="button" className="mt-1 min-h-[44px] text-sm font-semibold text-muted underline" onClick={() => setOpen(true)}>
        {t('talk.disagree')}
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <label className="block text-sm" htmlFor={`fb-${actionId}`}>{t('talk.disagree_prompt')}</label>
      <textarea id={`fb-${actionId}`} className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
      <button
        type="button" className="btn-ghost !min-h-[44px] text-sm" disabled={!text.trim()}
        onClick={async () => {
          await repo?.addFeedback(actionId, text.trim());
          setSent(true);
        }}
      >
        {t('talk.send_feedback')}
      </button>
    </div>
  );
}

export default function Talk() {
  const { t, lang } = useI18n();
  const { repo, today, actions, refresh, profile } = useApp();
  const [params] = useSearchParams();
  const [text, setText] = useState('');
  const textRef = useRef('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  const setBoth = useCallback((v: string) => {
    textRef.current = v;
    setText(v);
  }, []);
  const getBase = useCallback(() => textRef.current, []);
  const speech = useSpeech(lang, getBase, setBoth);

  useEffect(() => {
    repo?.listEntries(today).then(setEntries).catch(() => undefined);
  }, [repo, today, actions.length]);

  useEffect(() => {
    if (params.get('mic') === '1' && speech.supported) speech.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const totals = totalsForRange(actions, 'today', today);
  const teaching = getTeaching(result?.reflection?.teaching_id);

  return (
    <div className="space-y-5">
      <PageTitle sub={t('talk.edit_hint')}>{t('talk.title')}</PageTitle>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
      <div className="space-y-5">
      <section className="card space-y-3">
        <label htmlFor="story" className="sr-only">{t('talk.title')}</label>
        <textarea
          id="story" rows={6} className="field resize-y" placeholder={t('talk.placeholder')} value={text}
          onChange={(e) => setBoth(e.target.value)} maxLength={4000} lang={lang}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {speech.supported ? (
              <MicButton size="md" active={speech.listening} onClick={speech.listening ? speech.stop : speech.start} label={speech.listening ? t('talk.listening') : t('talk.hold')} />
            ) : null}
            <p className="text-sm text-muted" aria-live="polite">
              {!speech.supported ? t('talk.voice_unsupported') : speech.listening ? t('talk.listening') : speech.error ? t('talk.voice_error') : t('talk.hold')}
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={analyse} disabled={busy || !text.trim()}>
            {t('talk.analyse')}
          </button>
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

      {result && !result.safety_flag && (
        <section className="space-y-4" aria-live="polite">
          {result.actions.length === 0 ? (
            <p className="card text-muted">{t('talk.nothing_scored')}</p>
          ) : (
            <ul className="space-y-3">
              {result.actions.map((a) => (
                <ActionCard key={a.id} a={a}>
                  <Disagree actionId={a.id} />
                </ActionCard>
              ))}
            </ul>
          )}

          <div className="card !px-2">
            <h2 className="mb-2 px-2 text-lg font-bold">{t('talk.day_totals')}</h2>
            <GhadaPair punya={totals.punya} paap={totals.paap} range="today" />
            <div className="mt-3"><NetPill net={totals.net} label={t('home.net_today')} /></div>
          </div>

          {teaching && result.reflection && (
            <div className="card">
              <h2 className="text-lg font-bold">{t('talk.reflection')}</h2>
              <blockquote className="mt-2 border-l-4 border-saffron pl-3 font-serif text-lg leading-relaxed">
                {teaching.text[lang]}
                <footer className="mt-1 font-sans text-sm text-muted">— {teaching.source}</footer>
              </blockquote>
              {result.reflection.suggestion && (
                <p className="mt-3 rounded-xl bg-saffron/15 p-3">
                  <span className="font-semibold text-saffron-text">{t('home.suggestion')}: </span>
                  {result.reflection.suggestion}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      </div>

      <section aria-labelledby="hist" className="lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
        <h2 id="hist" className="mb-2 text-lg font-bold">{t('talk.today_entries')}</h2>
        {entries.length === 0 ? (
          <p className="text-muted">{t('talk.no_entries')}</p>
        ) : (
          <ul className="space-y-3">
            {[...entries].reverse().map((e) => {
              const acts = actions.filter((a) => a.entry_id === e.id);
              return (
                <li key={e.id} className="card">
                  <p className="text-sm text-muted">
                    {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{e.transcript ?? (profile?.keep_words === false ? t('talk.not_kept') : '')}</p>
                  {acts.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {acts.map((a) => <ActionCard key={a.id} a={a} />)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
