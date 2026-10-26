import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n, LANG_LABEL } from '../lib/i18n';
import { GOALS, type Goal, type Greeting, type Lang, type Tradition } from '../lib/types';

const TRADITIONS: Tradition[] = ['hindu_gita', 'jain', 'swaminarayan', 'general'];
const GREETINGS: Greeting[] = ['jsk', 'jj', 'jsw', 'namaste', 'radhe'];
const TOTAL = 6;

export default function Onboarding() {
  const { t, num } = useI18n();
  const { profile, updateProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.name ?? '');
  const [tradition, setTradition] = useState<Tradition>(profile?.tradition ?? 'hindu_gita');
  const [greeting, setGreeting] = useState<Greeting>(profile?.greeting ?? 'jsk');
  const [goals, setGoals] = useState<Goal[]>(profile?.goals ?? []);
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
      await updateProfile({ name: name.trim(), tradition, greeting, goals, consent_at: new Date().toISOString(), onboarding_done: true });
      navigate('/', { replace: true });
    } catch {
      setError(t('common.error'));
      setBusy(false);
    }
  };

  const toggleGoal = (g: Goal) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  return (
    <div className="mx-auto max-w-md px-4 pb-12 pt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-saffron-text">{t('onb.title')}</p>
        <LanguageSwitcher />
      </div>
      <p className="text-sm text-muted" aria-live="polite">{t('onb.step', { n: num(step), total: num(TOTAL) })}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
        <div className="h-full bg-saffron transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      <section className="card mt-5" aria-labelledby="q">
        {step === 1 && (
          <>
            <h1 id="q" className="text-xl font-bold">{t('onb.name.q')}</h1>
            <input aria-labelledby="q" className="field mt-3" value={name} placeholder={t('onb.name.ph')} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 id="q" className="text-xl font-bold">{t('onb.lang.q')}</h1>
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
            <h1 id="q" className="text-xl font-bold">{t('onb.tradition.q')}</h1>
            <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-labelledby="q">
              {TRADITIONS.map((x) => (
                <button key={x} type="button" role="radio" aria-checked={tradition === x} className="chip justify-start" onClick={() => setTradition(x)}>{t(`tradition.${x}`)}</button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h1 id="q" className="text-xl font-bold">{t('onb.greeting.q')}</h1>
            <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-labelledby="q">
              {GREETINGS.map((x) => (
                <button key={x} type="button" role="radio" aria-checked={greeting === x} className="chip justify-start" onClick={() => setGreeting(x)}>{t(`greeting.${x}`)}</button>
              ))}
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h1 id="q" className="text-xl font-bold">{t('onb.goals.q')}</h1>
            <p className="text-sm text-muted">{t('onb.goals.hint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g} type="button" aria-pressed={goals.includes(g)} className="chip" onClick={() => toggleGoal(g)}>{t(`goal.${g}`)}</button>
              ))}
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h1 id="q" className="text-xl font-bold">{t('onb.consent.q')}</h1>
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
        {step > 1 ? (
          <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)}>{t('common.back')}</button>
        ) : <span />}
        <div className="flex items-center gap-3">
          {step > 1 && step < TOTAL && (
            <button type="button" className="min-h-[44px] px-2 font-semibold text-muted underline" onClick={() => setStep(TOTAL)}>{t('common.skip')}</button>
          )}
          {step < TOTAL ? (
            <button type="button" className="btn-primary" onClick={next}>{t('common.continue')}</button>
          ) : (
            <button type="button" className="btn-primary" onClick={finish} disabled={busy}>{t('onb.finish')}</button>
          )}
        </div>
      </div>
    </div>
  );
}
