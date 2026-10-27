import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { useTithi } from '../lib/useTithi';

export function LotusMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD777" />
          <stop offset="1" stopColor="#E2992A" />
        </linearGradient>
      </defs>
      <g fill="url(#lm-g)" stroke="#B9791E" strokeWidth="1">
        <path d="M24 6c6 7 6 17 0 25-6-8-6-18 0-25z" />
        <path d="M8 14c8 1 14 6 16 17-9-1-15-7-16-17z" />
        <path d="M40 14c-8 1-14 6-16 17 9-1 15-7 16-17z" />
        <path d="M4 26c7 0 14 4 20 12-9 1-17-3-20-12z" opacity="0.9" />
        <path d="M44 26c-7 0-14 4-20 12 9 1 17-3 20-12z" opacity="0.9" />
      </g>
      <path d="M12 40c8 4 16 4 24 0" stroke="#B9791E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Closes on outside click or Escape. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function Menu({ children }: { children: ReactNode }) {
  return <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-card p-2 shadow-lift">{children}</div>;
}

export function TopBar() {
  const { t, date, lang } = useI18n();
  const { profile, user, today, signOut } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const bell = usePopover();
  const avatar = usePopover();
  const tithi = useTithi(lang, today);
  const name = profile?.name || user?.email?.split('@')[0] || '';
  const initial = (name[0] ?? 'K').toUpperCase();
  const greeting = t(`greeting.${profile?.greeting ?? 'namaste'}`);
  const reminder = profile?.reminder_time?.slice(0, 5) ?? null;

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/wisdom?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-3 lg:w-[15.5rem]" aria-label="Karma Ghada">
          <LotusMark />
          <span className="hidden sm:block">
            <span className="block font-display text-3xl font-bold leading-none text-saffron-text">Karma Ghada</span>
            <span className="mt-1 block text-xs text-muted">{t('header.tagline')}</span>
          </span>
        </Link>

        <form onSubmit={search} role="search" className="relative hidden max-w-xl flex-1 md:block">
          <label htmlFor="global-search" className="sr-only">{t('header.search')}</label>
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="global-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('header.search')}
            className="min-h-[48px] w-full rounded-full border border-line bg-card/90 pl-12 pr-4 text-base shadow-inner placeholder:text-muted/80 focus:border-saffron"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/wisdom" aria-label={t('header.search')} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-indigo-soft md:hidden">
            <Icon name="search" size={22} />
          </Link>
          <LanguageSwitcher compact className="hidden sm:flex" />

          <div className="relative" ref={bell.ref}>
            <button
              type="button" aria-label={t('header.notifications')} aria-expanded={bell.open} aria-haspopup="true"
              onClick={() => bell.setOpen((o) => !o)} className="relative grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-indigo-soft"
            >
              <Icon name="bell" size={24} />
              {!reminder && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#E5483B] ring-2 ring-bg" aria-hidden="true" />}
            </button>
            {bell.open && (
              <Menu>
                <p className="px-3 py-2 text-sm">{reminder ? t('header.reminder_on', { time: reminder }) : t('header.reminder_off')}</p>
                <Link to="/profile" onClick={() => bell.setOpen(false)} className="block rounded-xl px-3 py-2 font-semibold text-saffron-text hover:bg-indigo-soft">
                  {t('header.set_reminder')}
                </Link>
              </Menu>
            )}
          </div>

          <div className="relative" ref={avatar.ref}>
            <button
              type="button" aria-expanded={avatar.open} aria-haspopup="true" aria-label={name || t('nav.profile')}
              onClick={() => avatar.setOpen((o) => !o)} className="flex min-h-[48px] items-center gap-3 rounded-full py-1 pl-1 pr-1 hover:bg-indigo-soft lg:pr-3"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full font-display text-2xl font-bold text-[#2A1A08] shadow-soft" style={{ background: 'radial-gradient(circle at 30% 25%, #FFE2A0, #F2A93B)' }}>
                {initial}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block text-sm font-bold leading-tight">{greeting}, {name} 🙏</span>
                <span className="block text-xs text-muted">{tithi}{tithi ? '  |  ' : ''}{date(today, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
            </button>
            {avatar.open && (
              <Menu>
                <Link to="/profile" onClick={() => avatar.setOpen(false)} className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 font-semibold hover:bg-indigo-soft">
                  <Icon name="user" size={20} />{t('profile.title')}
                </Link>
                <button
                  type="button" className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 font-semibold hover:bg-indigo-soft"
                  onClick={() => signOut().then(() => navigate('/welcome', { replace: true }))}
                >
                  <Icon name="logout" size={20} />{t('auth.signout')}
                </button>
              </Menu>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-line/50 px-3 pb-1 sm:hidden">
        <LanguageSwitcher compact />
      </div>
    </header>
  );
}
