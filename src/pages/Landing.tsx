import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ghada } from '../components/Ghada';
import { GhadaSmoke } from '../components/GhadaSmoke';
import { Icon } from '../components/Icon';
import { KarmaMark } from '../components/Brand';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LotusDivider } from '../components/Mandala';
import { OmChakra } from '../components/SacredArt';
import { ShlokaCard } from '../components/ShlokaCard';
import { VisitorCount } from '../components/VisitorCount';
import { localDate } from '../lib/ghada';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';

export default function Landing() {
  const { t } = useI18n();
  const { signInGoogle } = useApp();
  const [err, setErr] = useState('');

  const google = async () => {
    try {
      await signInGoogle();
    } catch (e) {
      setErr(e instanceof Error && e.message === 'google_not_configured' ? t('auth.setup') : t('common.error'));
    }
  };

  return (
    <div className="welcome-page mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-7 lg:px-9">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <KarmaMark size={52} />
          <span className="font-display text-3xl font-bold text-ink">{t('app.name')}</span>
        </span>
        <LanguageSwitcher />
      </div>

      <section className="welcome-hero mt-5" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="welcome-eyebrow">{t('landing.eyebrow')}</p>
          <h1 id="welcome-title" className="mt-4 max-w-[13ch] text-[clamp(3.1rem,6vw,5.7rem)] leading-[0.94] tracking-[-0.025em] text-cream">{t('landing.promise')}</h1>
          <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-cream/80 sm:text-lg">{t('landing.sub')}</p>
        </div>

        <div className="welcome-vessels" aria-label={t('landing.f2.t')}>
          <div className="welcome-vessel-pair">
            <figure className="welcome-vessel" data-kind="punya">
              <div className="welcome-pot-wrap">
                <Ghada kind="punya" fraction={0.72} label={t('home.punya_ghada')} className="welcome-pot" />
                <GhadaSmoke kind="punya" />
              </div>
              <figcaption>{t('home.punya_ghada')}</figcaption>
            </figure>
            <figure className="welcome-vessel" data-kind="paap">
              <div className="welcome-pot-wrap">
                <Ghada kind="paap" fraction={0.28} label={t('home.paap_ghada')} className="welcome-pot" />
                <GhadaSmoke kind="paap" />
              </div>
              <figcaption>{t('home.paap_ghada')}</figcaption>
            </figure>
          </div>
        </div>

        <div className="welcome-actions">
          <button type="button" className="welcome-google" onClick={google}>
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.5v5.4h7C42.6 36.6 45 31 45 24.5z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7-5.4c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.2H4.4v5.6C8 41.2 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.2-5.6z"/><path fill="#EA4335" d="M24 10.6c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4 29.9 2 24 2 15.4 2 8 6.8 4.4 14.2l7.2 5.6c1.7-5.3 6.6-9.2 12.4-9.2z"/></svg>
            {t('landing.google')}
          </button>
          <Link to="/auth?mode=signup" className="welcome-email">{t('landing.email')} <span aria-hidden="true">→</span></Link>
          <Link to="/auth" className="welcome-signin">{t('auth.have_account')}</Link>
          {err && <p role="alert" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-cream">{err}</p>}
        </div>
      </section>

      <LotusDivider className="my-8" />

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center" aria-label={t('landing.shloka_intro')}>
        <div className="text-center lg:text-left">
          <OmChakra className="mx-auto h-52 w-52 lg:mx-0 lg:h-72 lg:w-72" />
          <p className="mt-3 font-display text-3xl font-bold">{t('landing.shloka_intro')}</p>
        </div>
        <ShlokaCard date={localDate()} />
      </section>

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

      <div className="mt-6 text-center"><VisitorCount /></div>
    </div>
  );
}
