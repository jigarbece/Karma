import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from './Icon';
import { TopBar } from './TopBar';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/app';
import { dailyTeaching } from '../lib/teachings';

const SIDE_ITEMS = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/talk', key: 'nav.talk_log', icon: 'mic' },
  { to: '/insights', key: 'nav.insights', icon: 'chart' },
  { to: '/wisdom/gita', key: 'nav.gita', icon: 'book' },
  { to: '/wisdom/jain', key: 'nav.jain', icon: 'lotus' },
  { to: '/pratikraman', key: 'nav.pratikraman', icon: 'bhakti' },
  { to: '/goals', key: 'nav.goals', icon: 'goal' },
  { to: '/awards', key: 'nav.awards', icon: 'trophy' },
  { to: '/journal', key: 'nav.journal', icon: 'pen' },
];

const BOTTOM_ITEMS = [
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

export function Shell() {
  const { t, lang } = useI18n();
  const { profile, today } = useApp();
  const online = useOnline();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const quote = dailyTeaching(today, profile?.tradition ?? 'general');

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-card px-3 py-2">Skip to content</a>
      {!online && (
        <div role="status" className="bg-night px-4 py-2 text-center text-sm text-cream">{t('offline.banner')}</div>
      )}
      <TopBar />

      <div className="mx-auto flex max-w-[1500px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-[17rem] shrink-0 flex-col gap-4 overflow-y-auto px-4 py-5 lg:flex">
          <nav aria-label={`${t('nav.label')} (side)`}>
            <ul className="space-y-1">
              {SIDE_ITEMS.map((i) => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.end}
                    className={({ isActive }) =>
                      `flex min-h-[50px] items-center gap-4 rounded-2xl px-4 text-[1.05rem] font-medium transition ${
                        isActive ? 'bg-sand font-semibold text-ink shadow-soft' : 'text-ink/80 hover:bg-sand/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon name={i.icon} size={22} className={isActive ? 'text-saffron-text' : 'text-muted'} />
                        {t(i.key)}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <figure className="mt-auto rounded-2xl border border-line/80 bg-card/70 p-4">
            <Icon name="ahimsa" size={26} className="text-good" />
            <blockquote className="mt-2 font-display text-lg leading-snug">“{quote.text[lang]}”</blockquote>
            <figcaption className="mt-2 text-sm text-muted">— {quote.source}</figcaption>
          </figure>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-3 pb-32 pt-4 sm:px-5 lg:pb-12 lg:pl-2 lg:pr-6">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
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
          {BOTTOM_ITEMS.map((i) => (
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
