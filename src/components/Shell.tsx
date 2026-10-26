import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Mandala } from './Mandala';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/app';

const ITEMS = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/talk', key: 'nav.talk', icon: 'mic' },
  { to: '/insights', key: 'nav.insights', icon: 'chart' },
  { to: '/pratikraman', key: 'nav.pratikraman', icon: 'lotus' },
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

function SignOutButton({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  const { t } = useI18n();
  const { signOut } = useApp();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label={t('auth.signout')}
      title={t('auth.signout')}
      onClick={() => signOut().then(() => navigate('/welcome', { replace: true }))}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-3 font-semibold ${className}`}
    >
      <Icon name="logout" size={20} />
      {showText && <span>{t('auth.signout')}</span>}
    </button>
  );
}

export function Shell() {
  const { t } = useI18n();
  const { profile } = useApp();
  const online = useOnline();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <div className="min-h-dvh lg:flex">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-card px-3 py-2">Skip to content</a>

      {/* Desktop sidebar: a quiet temple at night */}
      <aside
        className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col overflow-hidden p-5 text-cream lg:flex"
        style={{ background: 'linear-gradient(175deg, rgb(var(--night)), rgb(var(--night-2)))' }}
      >
        <Mandala className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 text-gold-light opacity-[0.12]" />
        <div className="relative mb-8 flex items-center gap-3 px-2 pt-1">
          <img src="/favicon.svg" alt="" className="h-11 w-11 rounded-2xl shadow-glow" />
          <div>
            <div className="font-display text-3xl font-bold leading-none text-gold-light">Karma</div>
            <div className="mt-1 text-xs tracking-wide text-cream/70">{t('landing.promise')}</div>
          </div>
        </div>
        <nav aria-label={`${t('nav.label')} (side)`} className="relative">
          <ul className="space-y-1.5">
            {ITEMS.map((i) => (
              <li key={i.to}>
                <NavLink
                  to={i.to}
                  end={i.end}
                  className={({ isActive }) =>
                    `flex min-h-[50px] items-center gap-3 rounded-2xl px-4 font-semibold transition ${
                      isActive ? 'bg-white/12 text-gold-light shadow-inner ring-1 ring-gold-light/30' : 'text-cream/80 hover:bg-white/8 hover:text-cream'
                    }`
                  }
                >
                  <Icon name={i.icon} size={22} />
                  {t(i.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative mt-auto space-y-2 border-t border-white/15 pt-4">
          {profile?.name && <p className="truncate px-3 text-sm text-cream/70">{profile.name}</p>}
          <SignOutButton className="w-full justify-start text-cream/85 hover:bg-white/10 hover:text-cream" />
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-32 lg:pb-12">
        {!online && (
          <div role="status" className="bg-night px-4 py-2 text-center text-sm text-cream">
            {t('offline.banner')}
          </div>
        )}
        <header className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 pt-3 lg:max-w-6xl lg:px-8 lg:pt-5">
          <span className="font-display text-2xl font-bold text-saffron-text lg:invisible">Karma</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <SignOutButton showText={false} className="text-muted hover:bg-indigo-soft lg:hidden" />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-md px-4 pt-3 lg:max-w-6xl lg:px-8">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile: floating pill navigation */}
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-3 bottom-3 z-40 rounded-[2rem] border border-gold-light/30 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-md lg:hidden"
        style={{ background: 'linear-gradient(160deg, rgb(var(--night) / 0.96), rgb(var(--night-2) / 0.96))' }}
      >
        <ul className="mx-auto flex max-w-md justify-between px-2 py-1">
          {ITEMS.map((i) => (
            <li key={i.to} className="flex-1">
              <NavLink
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-xs font-semibold ${
                    isActive ? 'text-gold-light' : 'text-cream/75'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-white/15 ring-1 ring-gold-light/40' : ''}`}>
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
