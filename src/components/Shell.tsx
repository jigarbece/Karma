import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
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
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-3 font-semibold text-muted hover:bg-indigo-soft hover:text-ink ${className}`}
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
  return (
    <div className="min-h-dvh lg:flex">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-card px-3 py-2">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card/80 p-4 backdrop-blur lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl" />
          <span className="font-serif text-2xl font-bold text-saffron-text">Karma</span>
        </div>
        <nav aria-label={`${t('nav.label')} (side)`}>
          <ul className="space-y-1">
            {ITEMS.map((i) => (
              <li key={i.to}>
                <NavLink
                  to={i.to}
                  end={i.end}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center gap-3 rounded-xl px-3 font-semibold ${
                      isActive ? 'bg-saffron/25 text-saffron-text' : 'text-muted hover:bg-indigo-soft hover:text-ink'
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
        <div className="mt-auto space-y-2 border-t border-line pt-4">
          {profile?.name && <p className="truncate px-3 text-sm text-muted">{profile.name}</p>}
          <SignOutButton className="w-full justify-start" />
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-10">
        {!online && (
          <div role="status" className="bg-indigo px-4 py-2 text-center text-sm text-card">
            {t('offline.banner')}
          </div>
        )}
        <header className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 pt-2 lg:max-w-6xl lg:px-8 lg:pt-4">
          <span className="font-serif text-lg font-bold text-saffron-text lg:invisible">Karma</span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <SignOutButton showText={false} className="lg:hidden" />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-md px-4 pt-2 lg:max-w-6xl lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-md justify-between px-2">
          {ITEMS.map((i) => (
            <li key={i.to} className="flex-1">
              <NavLink
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs font-semibold ${
                    isActive ? 'text-saffron-text' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-saffron/25' : ''}`}>
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
