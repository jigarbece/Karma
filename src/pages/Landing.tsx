import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghada } from '../components/Ghada';
import { Icon } from '../components/Icon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LotusDivider, Mandala } from '../components/Mandala';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { demoAllowed } from '../lib/supabase';

export default function Landing() {
  const { t } = useI18n();
  const { signInGoogle, startDemo } = useApp();
  const navigate = useNavigate();
  const [err, setErr] = useState('');

  const google = async () => {
    try {
      await signInGoogle();
    } catch (e) {
      setErr(e instanceof Error && e.message === 'google_not_configured' ? t('auth.google_setup') : t('common.error'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-14 pt-4 lg:max-w-6xl lg:px-8">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-xl shadow-soft" />
          <span className="font-display text-3xl font-bold text-saffron-text">Karma</span>
        </span>
        <LanguageSwitcher />
      </div>

      {/* Hero: a night sky with a slowly turning mandala */}
      <section className="panel-night mt-5 p-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:p-12">
        <Mandala className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] text-gold-light opacity-[0.13]" />
        <div className="relative lg:order-2">
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-2 lg:max-w-md lg:gap-5">
            <Ghada kind="punya" fraction={0.72} label="Punya ghada" className="w-full" />
            <Ghada kind="paap" fraction={0.28} label="Paap ghada" className="w-full" />
          </div>
        </div>

        <div className="relative mt-6 text-center lg:order-1 lg:mt-0 lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-light/90">Punya · Paap · Pratikraman</p>
          <h1 className="mt-3 text-5xl leading-[1.05] text-cream lg:text-7xl">{t('landing.promise')}</h1>
          <p className="mx-auto mt-4 max-w-prose text-lg text-cream/85 lg:mx-0">{t('landing.sub')}</p>

          <div className="mt-7 flex flex-col gap-3 lg:max-w-sm">
            <button type="button" className="btn-primary" onClick={google}>
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.5v5.4h7C42.6 36.6 45 31 45 24.5z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7-5.4c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.4v5.6C8 41.2 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.2-5.6z"/><path fill="#EA4335" d="M24 10.6c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4 29.9 2 24 2 15.4 2 8 6.8 4.4 14.2l7.2 5.6c1.7-5.3 6.6-9.2 12.4-9.2z"/></svg>
              {t('landing.google')}
            </button>
            <button type="button" className="btn border border-gold-light/40 bg-white/10 text-cream backdrop-blur hover:bg-white/15" onClick={() => navigate('/auth')}>
              {t('landing.email')}
            </button>
            {demoAllowed && (
              <button type="button" className="min-h-[44px] font-semibold text-gold-light underline underline-offset-4" onClick={() => startDemo(true).then(() => navigate('/'))}>
                {t('landing.demo')}
              </button>
            )}
            {err && <p role="alert" className="rounded-xl bg-white/90 px-3 py-2 text-center text-sm font-semibold text-night">{err}</p>}
          </div>
        </div>
      </section>

      <LotusDivider className="my-8" />

      <ul className="grid gap-4 sm:grid-cols-3">
        {[
          ['mic', 'landing.f1'],
          ['chart', 'landing.f2'],
          ['lotus', 'landing.f3'],
        ].map(([icon, k]) => (
          <li key={k} className="card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-light/60 to-saffron/30 text-saffron-text">
              <Icon name={icon} />
            </span>
            <h2 className="mt-3 text-lg font-bold">{t(`${k}.t`)}</h2>
            <p className="mt-1 text-muted">{t(`${k}.d`)}</p>
          </li>
        ))}
      </ul>

      <p className="card mt-6 flex gap-3 text-sm">
        <Icon name="info" className="mt-0.5 shrink-0 text-saffron-text" />
        <span>
          {t('landing.privacy')}{' '}
          <Link to="/privacy" className="font-semibold text-saffron-text underline">{t('profile.privacy')}</Link>
        </span>
      </p>
    </div>
  );
}
