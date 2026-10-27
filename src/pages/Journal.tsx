import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import type { Entry } from '../lib/types';
import { ActionCard, PageTitle, Spinner } from '../components/ui';

/** Every entry the user has shared, newest first, grouped by day. */
export default function Journal() {
  const { t, date } = useI18n();
  const { repo, actions, profile } = useApp();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    repo?.listAllEntries().then(setEntries).catch(() => setEntries([]));
  }, [repo, actions.length]);

  const groups = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries ?? []) m.set(e.entry_date, [...(m.get(e.entry_date) ?? []), e]);
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle sub={t('journal.sub')}>{t('journal.title')}</PageTitle>
      {entries === null ? (
        <Spinner label={t('common.loading')} />
      ) : groups.length === 0 ? (
        <div className="card space-y-3">
          <p className="text-muted">{t('journal.empty')}</p>
          <Link to="/talk" className="btn-primary w-fit">{t('journal.write')}</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, list]) => (
            <section key={day} aria-labelledby={`d-${day}`}>
              <h2 id={`d-${day}`} className="mb-2 font-display text-2xl font-bold">{date(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
              <ul className="space-y-3">
                {list.map((e) => {
                  const acts = actions.filter((a) => a.entry_id === e.id);
                  return (
                    <li key={e.id} className="card">
                      <p className="text-sm text-muted">{new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {e.transcript ? (
                        <p className="mt-1 whitespace-pre-wrap">{e.transcript}</p>
                      ) : profile?.keep_words === false ? (
                        <p className="mt-1 text-muted">{t('talk.not_kept')}</p>
                      ) : null}
                      {acts.length > 0 && <ul className="mt-3 space-y-2">{acts.map((a) => <ActionCard key={a.id} a={a} />)}</ul>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
