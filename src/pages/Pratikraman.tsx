import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays } from '../lib/ghada';
import { useSpeech } from '../lib/useSpeech';
import type { KarmaAction, PratikramanRecord } from '../lib/types';
import { ActionCard, PageTitle, Segmented } from '../components/ui';
import { Icon } from '../components/Icon';

function Item({ a, existing, onSave }: { a: KarmaAction; existing?: PratikramanRecord; onSave: (id: string, r: string, c: string) => Promise<void> }) {
  const { t, lang } = useI18n();
  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [commitment, setCommitment] = useState(existing?.commitment ?? '');
  const [saved, setSaved] = useState(Boolean(existing));
  const [busy, setBusy] = useState(false);
  const ref = useRef(reflection);
  const setR = useCallback((v: string) => {
    ref.current = v;
    setReflection(v);
    setSaved(false);
  }, []);
  const speech = useSpeech(lang, () => ref.current, setR);

  return (
    <>
      <ActionCard a={a}>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor={`r-${a.id}`} className="font-semibold">{t('prat.reflection')}</label>
            <div className="flex gap-2">
              <textarea id={`r-${a.id}`} rows={2} className="field" placeholder={t('prat.reflection_ph')} value={reflection} onChange={(e) => setR(e.target.value)} maxLength={1000} />
              {speech.supported && (
                <button type="button" className="btn-ghost !px-3" aria-label={t('prat.mic')} aria-pressed={speech.listening} onClick={speech.listening ? speech.stop : speech.start}>
                  <Icon name={speech.listening ? 'stop' : 'mic'} />
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor={`c-${a.id}`} className="font-semibold">{t('prat.commitment')}</label>
            <input id={`c-${a.id}`} className="field" placeholder={t('prat.commitment_ph')} value={commitment} onChange={(e) => { setCommitment(e.target.value); setSaved(false); }} maxLength={300} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button" className="btn-indigo" disabled={busy || (!reflection.trim() && !commitment.trim())}
              onClick={async () => {
                setBusy(true);
                await onSave(a.id, reflection.trim(), commitment.trim());
                setSaved(true);
                setBusy(false);
              }}
            >
              {t('prat.save')}
            </button>
            {saved && <span className="inline-flex items-center gap-1 font-semibold text-saffron-text" role="status"><Icon name="check" size={18} />{t('prat.saved')}</span>}
          </div>
        </div>
      </ActionCard>
    </>
  );
}

export default function Pratikraman() {
  const { t, num } = useI18n();
  const { actions, today, repo, profile } = useApp();
  const [range, setRange] = useState<'today' | 'week'>('today');
  const [records, setRecords] = useState<PratikramanRecord[]>([]);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    repo?.listPratikraman().then(setRecords).catch(() => undefined);
  }, [repo]);

  const items = useMemo(() => {
    const from = range === 'today' ? today : addDays(today, -6);
    return actions.filter((a) => a.type === 'paap' && a.date >= from && a.date <= today).sort((x, y) => (x.date < y.date ? 1 : -1));
  }, [actions, range, today]);

  const recMap = new Map(records.map((r) => [r.action_id, r]));
  const pending = items.filter((a) => !recMap.has(a.id)).length;
  const jain = profile?.tradition === 'jain';
  const kshama = jain ? t('prat.kshama_jain') : t('prat.kshama');

  const save = async (id: string, reflection: string, commitment: string) => {
    if (!repo) return;
    const rec = await repo.savePratikraman(id, reflection, commitment);
    setRecords((cur) => [...cur.filter((r) => r.action_id !== id), rec]);
  };

  if (complete) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-gold/25 text-saffron-text"><Icon name="lotus" size={56} /></span>
        <h1 className="font-serif text-3xl font-bold">{t('prat.complete.title')}</h1>
        <p className="max-w-sm text-lg">{t('prat.complete.body')}</p>
        <p className="font-serif text-xl text-saffron-text">{jain ? `${t('prat.kshama_jain')} 🙏` : t('prat.kshama_line')}</p>
        <button type="button" className="btn-ghost" onClick={() => setComplete(false)}>{t('common.done')}</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageTitle sub={t('prat.sub')}>{t('prat.title')}</PageTitle>
      <Segmented label={t('prat.title')} value={range} onChange={setRange} options={[
        { value: 'today', label: t('prat.range_today') }, { value: 'week', label: t('prat.range_week') },
      ]} />

      {items.length === 0 ? (
        <p className="card text-muted">{t('prat.none')}</p>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">{t('prat.pending', { n: num(pending) })}</p>
          <ul className="space-y-4">
            {items.map((a) => <Item key={`${a.id}-${recMap.get(a.id)?.id ?? ''}`} a={a} existing={recMap.get(a.id)} onSave={save} />)}
          </ul>
        </>
      )}

      <div className="card space-y-3 text-center">
        <p className="text-sm text-muted">{t('prat.kshama_note')}</p>
        <button type="button" className="btn-primary w-full" disabled={items.length > 0 && records.filter((r) => items.some((a) => a.id === r.action_id)).length === 0} onClick={() => setComplete(true)}>
          {kshama}
        </button>
      </div>
    </div>
  );
}
