import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { supabaseConfigured } from '../lib/supabase';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const { t } = useI18n();
  const { signInEmail, signUp, resetPassword, updatePassword, signInGoogle } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'reset' ? 'reset' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInEmail(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        const { needsVerification } = await signUp(email, password);
        if (needsVerification) setMsg(t('auth.check_email'));
        else navigate('/');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMsg(t('auth.reset_sent'));
      } else {
        await updatePassword(password);
        setMsg(t('auth.password_updated'));
        navigate('/');
      }
    } catch (ex) {
      setErr(ex instanceof Error && ex.message ? ex.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signin' ? t('auth.signin') : mode === 'signup' ? t('auth.signup') : mode === 'forgot' ? t('auth.forgot') : t('auth.set_password');

  return (
    <div className="mx-auto max-w-md px-4 pb-12 pt-8">
      <div className="flex items-center justify-between">
        <Link to="/welcome" className="text-sm font-semibold text-saffron-text">← {t('app.name')}</Link>
        <LanguageSwitcher />
      </div>
      <h1 className="mt-3 text-2xl font-bold">{title}</h1>
      {!supabaseConfigured && <p className="mt-2 rounded-xl bg-indigo-soft px-3 py-2 text-sm text-indigo">{t('common.demo')}</p>}

      <form onSubmit={submit} className="card mt-4 space-y-4" noValidate={false}>
        {mode !== 'reset' && (
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">{t('auth.email')}</label>
            <input id="email" type="email" autoComplete="email" required={supabaseConfigured} className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        {mode !== 'forgot' && (
          <div>
            <label htmlFor="pw" className="mb-1 block font-semibold">{mode === 'reset' ? t('auth.new_password') : t('auth.password')}</label>
            <input
              id="pw" type="password" minLength={8} required={supabaseConfigured}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="field" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pwhint"
            />
            <p id="pwhint" className="mt-1 text-sm text-muted">{t('auth.password_hint')}</p>
          </div>
        )}
        {err && <p role="alert" className="text-sm font-semibold text-indigo">{err}</p>}
        {msg && <p role="status" className="text-sm font-semibold text-saffron-text">{msg}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{title}</button>
      </form>

      {mode !== 'reset' && (
        <button
          type="button" className="btn-ghost mt-3 w-full"
          onClick={() => signInGoogle().catch((e) => setErr(e instanceof Error && e.message === 'google_not_configured' ? t('auth.google_setup') : t('common.error')))}
        >
          {t('landing.google')}
        </button>
      )}

      <div className="mt-4 flex flex-col items-start gap-1 text-sm">
        {mode === 'signin' && (
          <>
            <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('signup')}>{t('auth.no_account')}</button>
            <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('forgot')}>{t('auth.forgot')}</button>
          </>
        )}
        {mode === 'signup' && <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('signin')}>{t('auth.have_account')}</button>}
        {(mode === 'forgot' || mode === 'reset') && <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('signin')}>{t('auth.back_to_signin')}</button>}
      </div>
    </div>
  );
}
