import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const { t } = useI18n();
  const { signInEmail, signUp, resetPassword, updatePassword, signInGoogle } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'reset' ? 'reset' : params.get('mode') === 'signup' ? 'signup' : 'signin');
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
      setErr(ex instanceof Error && ex.message === 'auth_not_configured' ? t('auth.setup') : ex instanceof Error && ex.message ? ex.message : t('common.error'));
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
      <h1 className="mt-6 text-4xl font-bold text-ink">{title}</h1>
      {(mode === 'signin' || mode === 'signup') && <div className="mt-6 grid grid-cols-2 rounded-2xl border border-line bg-card p-1" role="group" aria-label={t('auth.signin')}>
        <button type="button" className={`min-h-11 rounded-xl font-semibold transition ${mode === 'signin' ? 'bg-night text-cream shadow-soft' : 'text-muted hover:text-ink'}`} aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setErr(''); setMsg(''); }}>{t('auth.signin')}</button>
        <button type="button" className={`min-h-11 rounded-xl font-semibold transition ${mode === 'signup' ? 'bg-night text-cream shadow-soft' : 'text-muted hover:text-ink'}`} aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setErr(''); setMsg(''); }}>{t('auth.signup')}</button>
      </div>}

      <form onSubmit={submit} className="card mt-4 space-y-4 !p-6" noValidate={false}>
        {mode !== 'reset' && (
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">{t('auth.email')}</label>
            <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        {mode !== 'forgot' && (
          <div>
            <label htmlFor="pw" className="mb-1 block font-semibold">{mode === 'reset' ? t('auth.new_password') : t('auth.password')}</label>
            <input
              id="pw" type="password" minLength={8} required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="field" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pwhint"
            />
            <p id="pwhint" className="mt-1 text-sm text-muted">{t('auth.password_hint')}</p>
          </div>
        )}
        {err && <p role="alert" className="text-sm font-semibold text-indigo">{err}</p>}
        {msg && <p role="status" className="text-sm font-semibold text-saffron-text">{msg}</p>}
        <button type="submit" className="btn-indigo w-full" disabled={busy}>{title}</button>
      </form>

      {mode !== 'reset' && (
        <button
          type="button" className="btn-ghost mt-3 w-full"
          onClick={() => signInGoogle().catch((e) => setErr(e instanceof Error && e.message === 'google_not_configured' ? t('auth.setup') : t('common.error')))}
        >
          {t('landing.google')}
        </button>
      )}

      <div className="mt-4 flex flex-col items-start gap-1 text-sm">
        {mode === 'signin' && <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('forgot')}>{t('auth.forgot')}</button>}
        {(mode === 'forgot' || mode === 'reset') && <button type="button" className="min-h-[44px] font-semibold text-saffron-text underline" onClick={() => setMode('signin')}>{t('auth.back_to_signin')}</button>}
      </div>
    </div>
  );
}
