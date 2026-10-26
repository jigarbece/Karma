import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n, LANG_LABEL } from '../lib/i18n';
import { GOALS, type Goal, type Greeting, type Lang, type Tradition } from '../lib/types';
import { PageTitle } from '../components/ui';
import { Icon } from '../components/Icon';
import { actionsToCsv, download } from '../lib/exporters';

const TRADITIONS: Tradition[] = ['hindu_gita', 'jain', 'swaminarayan', 'general'];
const GREETINGS: Greeting[] = ['jsk', 'jj', 'jsw', 'namaste', 'radhe'];

export default function Profile() {
  const { t } = useI18n();
  const { profile, updateProfile, repo, signOut, user, demo, actions } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? '');
    setCity(profile?.city ?? '');
  }, [profile?.name, profile?.city]);

  if (!profile) return null;

  const save = async (patch: Parameters<typeof updateProfile>[0]) => {
    setErr('');
    try {
      await updateProfile(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setErr(t('common.error'));
    }
  };

  const toggleGoal = (g: Goal) => save({ goals: profile.goals.includes(g) ? profile.goals.filter((x) => x !== g) : [...profile.goals, g] });

  const setReminder = async (value: string) => {
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'denied') setErr(t('profile.reminder_denied'));
    await save({ reminder_time: value || null });
  };

  const exportJson = async () => {
    const data = await repo?.exportAll();
    download('karma-export.json', JSON.stringify(data, null, 2), 'application/json');
  };
  const exportCsv = () => download('karma-actions.csv', actionsToCsv(actions), 'text/csv');

  const doDelete = async () => {
    setBusy(true);
    try {
      await repo?.deleteAll();
      await signOut();
      navigate('/welcome', { replace: true });
    } catch {
      setErr(t('common.error'));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0 [&>*]:min-w-0">
      <div className="lg:col-span-2">
        <PageTitle sub={user?.email ?? (demo ? t('common.demo') : undefined)}>{t('profile.title')}</PageTitle>
        <p className="h-5 text-sm font-semibold text-saffron-text" role="status">{saved ? t('profile.saved') : ''}</p>
        {err && <p role="alert" className="rounded-xl bg-indigo-soft p-3 text-sm font-semibold text-indigo">{err}</p>}
      </div>

      <section className="card space-y-4 lg:row-span-2" aria-labelledby="det">
        <h2 id="det" className="text-lg font-bold">{t('profile.edit')}</h2>
        <div>
          <label htmlFor="nm" className="mb-1 block font-semibold">{t('profile.name')}</label>
          <input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== profile.name && save({ name: name.trim() })} maxLength={60} />
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block font-semibold">{t('profile.city')}</label>
          <input id="city" className="field" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => city !== profile.city && save({ city: city.trim() })} maxLength={60} />
        </div>
        <fieldset>
          <legend className="mb-1 font-semibold">{t('profile.language')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(['gu', 'hi', 'en'] as Lang[]).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={profile.language === l} className="chip" onClick={() => save({ language: l })}>{LANG_LABEL[l]}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-semibold">{t('profile.tradition')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {TRADITIONS.map((x) => (
              <button key={x} type="button" role="radio" aria-checked={profile.tradition === x} className="chip" onClick={() => save({ tradition: x })}>{t(`tradition.${x}`)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-semibold">{t('profile.greeting')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {GREETINGS.map((x) => (
              <button key={x} type="button" role="radio" aria-checked={profile.greeting === x} className="chip" onClick={() => save({ greeting: x })}>{t(`greeting.${x}`)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-semibold">{t('profile.goals')}</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" aria-pressed={profile.goals.includes(g)} className="chip" onClick={() => toggleGoal(g)}>{t(`goal.${g}`)}</button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card space-y-4" aria-labelledby="pref">
        <h2 id="pref" className="text-lg font-bold">{t('profile.theme')}</h2>
        <div className="flex gap-2" role="radiogroup" aria-label={t('profile.theme')}>
          {(['light', 'dark'] as const).map((th) => (
            <button key={th} type="button" role="radio" aria-checked={profile.theme === th} className="chip" onClick={() => save({ theme: th })}>
              <Icon name={th === 'light' ? 'sun' : 'moon'} size={18} />{t(th === 'light' ? 'common.theme_light' : 'common.theme_dark')}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="rem" className="mb-1 block font-semibold">{t('profile.reminder')}</label>
          <div className="flex items-center gap-2">
            <input id="rem" type="time" className="field !w-auto" value={profile.reminder_time?.slice(0, 5) ?? ''} onChange={(e) => setReminder(e.target.value)} />
            {profile.reminder_time && <button type="button" className="btn-ghost" onClick={() => setReminder('')}>{t('profile.reminder_none')}</button>}
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold" id="kw">{t('profile.keep_words')}</div>
            <p className="text-sm text-muted">{t('profile.keep_words_hint')}</p>
          </div>
          <button
            type="button" role="switch" aria-checked={profile.keep_words} aria-labelledby="kw"
            onClick={() => save({ keep_words: !profile.keep_words })}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${profile.keep_words ? 'bg-saffron' : 'bg-line'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-all ${profile.keep_words ? 'left-7' : 'left-1'}`} />
            <span className="sr-only">{profile.keep_words ? t('common.on') : t('common.off')}</span>
          </button>
        </div>
      </section>

      <section className="card space-y-3" aria-labelledby="exp">
        <h2 id="exp" className="text-lg font-bold">{t('profile.export')}</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={exportJson}><Icon name="download" size={18} />{t('profile.export_json')}</button>
          <button type="button" className="btn-ghost" onClick={exportCsv}><Icon name="download" size={18} />{t('profile.export_csv')}</button>
        </div>
      </section>

      <section className="card">
        <ul className="divide-y divide-line">
          {[['/privacy', 'profile.privacy'], ['/terms', 'profile.terms'], ['/about', 'profile.about']].map(([to, k]) => (
            <li key={to}><Link to={to} className="flex min-h-[48px] items-center justify-between font-semibold">{t(k)}<span aria-hidden="true">›</span></Link></li>
          ))}
        </ul>
      </section>

      <button type="button" className="btn-ghost w-full" onClick={() => signOut().then(() => navigate('/welcome'))}>{t('auth.signout')}</button>

      <section className="card border-indigo/40" aria-labelledby="del">
        <h2 id="del" className="text-lg font-bold text-indigo">{t('profile.delete')}</h2>
        {!confirming ? (
          <button type="button" className="btn-ghost mt-3 !border-indigo text-indigo" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={18} />{t('profile.delete')}
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <p>{t('profile.delete_warn')}</p>
            <label htmlFor="cw" className="block font-semibold">{t('profile.delete_confirm_label')}</label>
            <input id="cw" className="field" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => { setConfirming(false); setWord(''); }}>{t('common.cancel')}</button>
              <button type="button" className="btn-indigo" disabled={word !== t('profile.delete_confirm_word') || busy} onClick={doDelete}>{t('profile.delete_now')}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
