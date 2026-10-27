import { useEffect, useState } from 'react';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { addDays, signedWeight } from '../lib/ghada';
import { GOALS, GOAL_CATEGORIES, type Goal, type PratikramanRecord } from '../lib/types';
import { CATEGORY_ICON, Icon } from '../components/Icon';
import { PageTitle } from '../components/ui';

const GOAL_ICON: Record<Goal, string> = {
  less_anger: 'krodh', more_seva: 'seva', truthful_speech: 'satya', patience: 'vani',
  family_time: 'family', discipline: 'discipline', daan: 'daan',
};

/** Pick goals and see this week's progress; recent Pratikraman commitments appear as sankalps. */
export default function Goals() {
  const { t, num } = useI18n();
  const { profile, actions, today, repo, updateProfile } = useApp();
  const [records, setRecords] = useState<PratikramanRecord[]>([]);

  useEffect(() => {
    repo?.listPratikraman().then(setRecords).catch(() => undefined);
  }, [repo]);

  if (!profile) return null;
  const from = addDays(today, -6);
  const active = GOALS.filter((g) => profile.goals.includes(g));
  const toggle = (g: Goal) =>
    updateProfile({ goals: profile.goals.includes(g) ? profile.goals.filter((x) => x !== g) : [...profile.goals, g] });
  const sankalps = [...records].filter((r) => r.commitment).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle sub={t('goals.sub')}>{t('goals.title')}</PageTitle>

      <section className="card" aria-labelledby="gp">
        <h2 id="gp" className="font-display text-2xl font-bold">{t('goals.pick')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g} type="button" className="chip" aria-pressed={profile.goals.includes(g)} onClick={() => toggle(g)}>
              <Icon name={GOAL_ICON[g]} size={18} />{t(`goal.${g}`)}
            </button>
          ))}
        </div>
      </section>

      {active.length === 0 ? (
        <p className="card text-muted">{t('goals.none')}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {active.map((g) => {
            const cats = GOAL_CATEGORIES[g];
            const net = actions.filter((a) => a.date >= from && cats.includes(a.category)).reduce((s, a) => s + signedWeight(a), 0);
            const pct = Math.max(0, Math.min(100, Math.round((net / 10) * 100)));
            return (
              <li key={g} className="card">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-saffron-text"><Icon name={GOAL_ICON[g]} size={26} /></span>
                  <div>
                    <h3 className="font-display text-2xl font-bold leading-tight">{t(`goal.${g}`)}</h3>
                    <p className="text-sm text-muted">{t('goals.progress', { n: `${net >= 0 ? '+' : '−'}${num(Math.abs(net))}` })}</p>
                  </div>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t(`goal.${g}`)}>
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-saffron" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {cats.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-sand/70 px-2.5 py-0.5 text-xs font-semibold">
                      <Icon name={CATEGORY_ICON[c]} size={13} />{t(`cat.${c}`)}
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <section className="card" aria-labelledby="sk">
        <h2 id="sk" className="font-display text-2xl font-bold">{t('goals.sankalp')}</h2>
        {sankalps.length === 0 ? (
          <p className="mt-2 text-muted">{t('goals.sankalp_empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sankalps.map((r) => (
              <li key={r.id} className="flex gap-3 rounded-2xl bg-sand/50 p-3">
                <Icon name="lotus" className="mt-0.5 shrink-0 text-saffron-text" />
                <span>{r.commitment}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
