import { useEffect, useState } from 'react';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { longestStreak, totalsForRange } from '../lib/ghada';
import type { PratikramanRecord } from '../lib/types';
import { Icon } from '../components/Icon';
import { PageTitle } from '../components/ui';

interface Badge {
  id: string;
  icon: string;
  cur: number;
  target: number;
}

/** Milestones computed from the user's own data. They celebrate steadiness, not scores. */
export default function Awards() {
  const { t, num } = useI18n();
  const { actions, today, repo } = useApp();
  const [records, setRecords] = useState<PratikramanRecord[]>([]);

  useEffect(() => {
    repo?.listPratikraman().then(setRecords).catch(() => undefined);
  }, [repo]);

  const scored = actions.filter((a) => a.type !== 'neutral');
  const best = longestStreak(actions);
  const sevaActs = scored.filter((a) => a.type === 'punya' && a.category === 'seva').length;
  const punya = totalsForRange(actions, 'lifetime', today).punya;

  const badges: Badge[] = [
    { id: 'first', icon: 'mic', cur: Math.min(1, scored.length), target: 1 },
    { id: 'streak3', icon: 'krodh', cur: Math.min(3, best), target: 3 },
    { id: 'streak7', icon: 'krodh', cur: Math.min(7, best), target: 7 },
    { id: 'streak30', icon: 'krodh', cur: Math.min(30, best), target: 30 },
    { id: 'seva10', icon: 'seva', cur: Math.min(10, sevaActs), target: 10 },
    { id: 'punya100', icon: 'sparkle', cur: Math.min(100, punya), target: 100 },
    { id: 'kshama', icon: 'lotus', cur: Math.min(1, records.length), target: 1 },
  ];
  const done = badges.filter((b) => b.cur >= b.target).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle sub={t('awards.sub')}>{t('awards.title')}</PageTitle>
      <p className="mb-4 font-display text-2xl text-saffron-text" aria-live="polite">{num(done)} / {num(badges.length)}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => {
          const unlocked = b.cur >= b.target;
          return (
            <li key={b.id} className={`card flex gap-4 ${unlocked ? 'ring-1 ring-gold/50' : ''}`}>
              <span
                className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${unlocked ? 'text-[#2A1A08] shadow-glow' : 'bg-line text-muted'}`}
                style={unlocked ? { background: 'radial-gradient(circle at 30% 25%, #FFE2A0, #F2A93B)' } : undefined}
              >
                <Icon name={unlocked ? b.icon : 'lock'} size={30} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold leading-tight">{t(`aw.${b.id}`)}</h2>
                <p className="text-sm text-muted">{t(`aw.${b.id}.d`)}</p>
                <p className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${unlocked ? 'text-good' : 'text-muted'}`}>
                  {unlocked ? <><Icon name="check2" size={16} />{t('awards.unlocked')}</> : t('awards.locked', { cur: num(Math.round(b.cur)), target: num(b.target) })}
                </p>
                {!unlocked && (
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={b.target} aria-valuenow={b.cur} aria-label={t(`aw.${b.id}`)}>
                    <div className="h-full rounded-full bg-saffron" style={{ width: `${(b.cur / b.target) * 100}%` }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
