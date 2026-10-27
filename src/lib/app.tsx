import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, supabaseConfigured } from './supabase';
import { defaultProfile, localRepo, makeSupabaseRepo, seedDemo, type Repo } from './repo';
import { localDate } from './ghada';
import { I18nProvider, translate } from './i18n';
import type { KarmaAction, Lang, Profile } from './types';

interface AppUser {
  id: string;
  email: string | null;
}

interface AppValue {
  ready: boolean;
  demo: boolean;
  user: AppUser | null;
  profile: Profile | null;
  repo: Repo | null;
  actions: KarmaAction[];
  today: string;
  lang: Lang;
  setLangPreview: (l: Lang) => void;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  startDemo: (withSample?: boolean) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppValue | null>(null);
const DEMO_FLAG = 'karma.demo.active';
const LANG_KEY = 'karma.lang';

function storedLang(): Lang {
  try {
    const l = localStorage.getItem(LANG_KEY);
    if (l === 'gu' || l === 'hi' || l === 'en') return l;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2);
  return nav === 'gu' ? 'gu' : nav === 'hi' ? 'hi' : 'en';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [actions, setActions] = useState<KarmaAction[]>([]);
  const [previewLang, setPreviewLang] = useState<Lang>(storedLang);

  const repo = useMemo<Repo | null>(() => {
    if (demo) return localRepo;
    if (user && supabaseConfigured) return makeSupabaseRepo(user.id);
    return null;
  }, [demo, user]);

  // Session bootstrap
  useEffect(() => {
    let cancelled = false;
    let isDemo = false;
    try {
      isDemo = localStorage.getItem(DEMO_FLAG) === '1';
    } catch {
      /* ignore */
    }
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        const u = data.session?.user;
        if (u) setUser({ id: u.id, email: u.email ?? null });
        else if (isDemo) {
          setDemo(true);
          setUser({ id: 'demo-user', email: null });
        }
        setReady(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
        if (u) setDemo(false);
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    }
    if (isDemo) {
      setDemo(true);
      setUser({ id: 'demo-user', email: null });
    }
    setReady(true);
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!repo) return;
    let p = await repo.getProfile();
    if (!p) p = await repo.saveProfile(defaultProfile(user?.id ?? 'demo-user'));
    setProfile(p);
    setActions(await repo.listActions());
  }, [repo, user]);

  useEffect(() => {
    if (!repo) {
      setProfile(null);
      setActions([]);
      return;
    }
    refresh().catch(() => setProfile(defaultProfile(user?.id ?? 'demo-user')));
  }, [repo, refresh, user]);

  // Theme + html lang
  const lang: Lang = profile?.language ?? previewLang;
  useEffect(() => {
    const theme = profile?.theme ?? 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    document.title = translate(lang, 'app.name');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'dark' ? '#12102E' : '#1E1B4B');
  }, [profile?.theme, lang]);

  const setLangPreview = useCallback((l: Lang) => {
    setPreviewLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!repo) return;
      const next = await repo.saveProfile(patch);
      setProfile(next);
      if (patch.language) setLangPreview(patch.language);
    },
    [repo, setLangPreview],
  );

  const startDemo = useCallback(async (withSample = true) => {
    seedDemo(withSample);
    try {
      localStorage.setItem(DEMO_FLAG, '1');
    } catch {
      /* ignore */
    }
    setDemo(true);
    setUser({ id: 'demo-user', email: null });
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!supabase) throw new Error('google_not_configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
  }, []);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return startDemo(false);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [startDemo],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        await startDemo(false);
        return { needsVerification: false };
      }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      return { needsVerification: !data.session };
    },
    [startDemo],
  );

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=reset` });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem(DEMO_FLAG);
    } catch {
      /* ignore */
    }
    if (supabase) await supabase.auth.signOut();
    setDemo(false);
    setUser(null);
    setProfile(null);
    setActions([]);
  }, []);

  const today = localDate(new Date(), profile?.timezone);

  const value = useMemo<AppValue>(
    () => ({
      ready, demo, user, profile, repo, actions, today, lang, setLangPreview, refresh, updateProfile, startDemo,
      signInGoogle, signInEmail, signUp, resetPassword, updatePassword, signOut,
    }),
    [ready, demo, user, profile, repo, actions, today, lang, setLangPreview, refresh, updateProfile, startDemo,
      signInGoogle, signInEmail, signUp, resetPassword, updatePassword, signOut],
  );

  return (
    <AppContext.Provider value={value}>
      <I18nProvider lang={lang}>{children}</I18nProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
