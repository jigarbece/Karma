import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from './Icon';
import { LotusMark } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/app';

const ITEMS = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/insights', key: 'nav.insights', icon: 'chart' },
  { to: '/history', key: 'nav.history', icon: 'pen' },
  { to: '/profile', key: 'nav.profile', icon: 'user' },
];

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Deliberately small: brand, three destinations, language, sign out. */
export function Shell() {
  const { t } = useI18n();
  const { signOut } = useApp();
  const navigate = useNavigate();
  const online = useOnline();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-card px-3 py-2">{t('nav.skip')}</a>
      {!online && <div role="status" className="bg-night px-4 py-2 text-center text-sm text-cream">{t('offline.banner')}</div>}

      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <Link to="/" className="flex items-center gap-2" aria-label={t('app.name')}>
            <LotusMark size={36} />
            <span className="hidden font-display text-3xl font-bold leading-none text-saffron-text min-[380px]:inline">{t('app.name')}</span>
          </Link>

          <nav aria-label={`${t('nav.label')} (top)`} className="ml-6 hidden md:block">
            <ul className="flex gap-1">
              {ITEMS.map((i) => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.end}
                    className={({ isActive }) =>
                      `inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold ${isActive ? 'bg-sand text-ink' : 'text-muted hover:bg-sand/60'}`
                    }
                  >
                    {t(i.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher compact />
            <button
              type="button" aria-label={t('auth.signout')} title={t('auth.signout')}
              onClick={() => signOut().then(() => navigate('/welcome', { replace: true }))}
              className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-indigo-soft hover:text-ink"
            >
              <Icon name="logout" size={22} />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl px-3 pb-32 pt-5 sm:px-5 md:pb-12">
        <motion.div key={pathname} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>

      {/* Phones: floating pill navigation */}
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-6 bottom-3 z-40 rounded-[2rem] border border-gold-light/30 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-md md:hidden"
        style={{ background: 'linear-gradient(160deg, rgb(var(--night) / 0.96), rgb(var(--night-2) / 0.96))' }}
      >
        <ul className="flex justify-between px-2 py-1">
          {ITEMS.map((i) => (
            <li key={i.to} className="flex-1">
              <NavLink
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-xs font-semibold ${isActive ? 'text-gold-light' : 'text-cream/75'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-white/15 ring-1 ring-gold-light/40' : ''}`}>
                      <Icon name={i.icon} size={22} />
                    </span>
                    <span>{t(i.key)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
