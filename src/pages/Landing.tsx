import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ghada } from '../components/Ghada';
import { Icon } from '../components/Icon';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { demoAllowed } from '../lib/supabase';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export default function Landing() {
  const { t } = useI18n();
  const { signInGoogle, startDemo, lang } = useApp();
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
    <div className="mx-auto max-w-md px-4 pb-12 pt-6 lg:max-w-6xl lg:px-8">
      <div className="flex items-center justify-between">
        <span className="font-serif text-2xl font-bold text-saffron-text">{lang === 'en' ? 'Karma' : `${t('app.name')} · Karma`}</span>
        <LanguageSwitcher />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
      <section className="mt-6 text-center lg:order-2 lg:mt-0">
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-2 lg:max-w-lg lg:gap-6">
          <Ghada kind="punya" fraction={0.72} label="Punya ghada" className="w-full" />
          <Ghada kind="paap" fraction={0.28} label="Paap ghada" className="w-full" />
        </div>
      </section>

      <div className="lg:order-1">
      <section className="mt-4 text-center lg:mt-0 lg:text-left">
        <h1 className="font-serif text-3xl font-bold leading-tight lg:text-5xl">{t('landing.promise')}</h1>
        <p className="mx-auto mt-3 max-w-prose text-muted lg:mx-0 lg:text-lg">{t('landing.sub')}</p>
      </section>

      <div className="mt-6 flex flex-col gap-3 lg:max-w-sm">
        <button type="button" className="btn-primary" onClick={google}>
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.5v5.4h7C42.6 36.6 45 31 45 24.5z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7-5.4c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.4v5.6C8 41.2 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.2-5.6z"/><path fill="#EA4335" d="M24 10.6c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4 29.9 2 24 2 15.4 2 8 6.8 4.4 14.2l7.2 5.6c1.7-5.3 6.6-9.2 12.4-9.2z"/></svg>
            {t('landing.google')}
        </button>
        <button type="button" className="btn-ghost" onClick={() => navigate('/auth')}>
          {t('landing.email')}
        </button>
        {demoAllowed && (
          <button type="button" className="btn-ghost" onClick={() => startDemo(true).then(() => navigate('/'))}>
            {t('landing.demo')}
          </button>
        )}
        {err && <p role="alert" className="text-center text-sm text-indigo">{err}</p>}
      </div>
      </div>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ['mic', 'landing.f1'],
          ['chart', 'landing.f2'],
          ['lotus', 'landing.f3'],
        ].map(([icon, k]) => (
          <li key={k} className="card">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/25 text-saffron-text"><Icon name={icon} /></span>
            <h2 className="mt-2 font-bold">{t(`${k}.t`)}</h2>
            <p className="text-sm text-muted">{t(`${k}.d`)}</p>
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
