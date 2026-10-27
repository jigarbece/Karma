import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n, LANG_LABEL } from '../lib/i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { Greeting, Lang } from '../lib/types';

const GREETINGS: Greeting[] = ['jsk', 'namaste', 'radhe', 'jsw', 'jj'];
const TOTAL = 4;

/** Four short steps: name, language, greeting, consent. Scoring always follows Hindu dharma. */
export default function Onboarding() {
  const { t, num } = useI18n();
  const { profile, updateProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.name ?? '');
  const [greeting, setGreeting] = useState<Greeting>(profile?.greeting ?? 'jsk');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const next = () => {
    setError('');
    if (step === 1 && !name.trim()) return setError(t('onb.name_required'));
    setStep((s) => Math.min(TOTAL, s + 1));
  };

  const finish = async () => {
    if (!consent) return setError(t('onb.consent_required'));
    setBusy(true);
    try {
      await updateProfile({ name: name.trim(), tradition: 'hindu_gita', greeting, goals: [], consent_at: new Date().toISOString(), onboarding_done: true });
      navigate('/', { replace: true });
    } catch {
      setError(t('common.error'));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-12 pt-8">
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl font-bold text-saffron-text">{t('onb.title')}</p>
        <LanguageSwitcher compact />
      </div>
      <p className="mt-1 text-sm text-muted" aria-live="polite">{t('onb.step', { n: num(step), total: num(TOTAL) })}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
        <div className="h-full bg-saffron transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      <section className="card mt-5" aria-labelledby="q">
        {step === 1 && (
          <>
            <h1 id="q" className="text-3xl">{t('onb.name.q')}</h1>
            <input aria-labelledby="q" className="field mt-3" value={name} placeholder={t('onb.name.ph')} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 id="q" className="text-3xl">{t('onb.lang.q')}</h1>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="q">
              {(['gu', 'hi', 'en'] as Lang[]).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={profile?.language === l} className="chip" onClick={() => updateProfile({ language: l })}>
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 id="q" className="text-3xl">{t('onb.greeting.q')}</h1>
            <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-labelledby="q">
              {GREETINGS.map((x) => (
                <button key={x} type="button" role="radio" aria-checked={greeting === x} className="chip justify-start" onClick={() => setGreeting(x)}>{t(`greeting.${x}`)}</button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h1 id="q" className="text-3xl">{t('onb.consent.q')}</h1>
            <label className="mt-3 flex min-h-[44px] items-start gap-3">
              <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[rgb(var(--saffron-text))]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{t('onb.consent.text')}</span>
            </label>
            <Link to="/privacy" target="_blank" className="mt-2 inline-block font-semibold text-saffron-text underline">{t('onb.consent.read')}</Link>
          </>
        )}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-indigo">{error}</p>}
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        {step > 1 ? <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)}>{t('common.back')}</button> : <span />}
        {step < TOTAL ? (
          <button type="button" className="btn-primary" onClick={next}>{t('common.continue')}</button>
        ) : (
          <button type="button" className="btn-primary" onClick={finish} disabled={busy}>{t('onb.finish')}</button>
        )}
      </div>
    </div>
  );
}
