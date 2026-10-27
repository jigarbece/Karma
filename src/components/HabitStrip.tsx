import { useI18n } from '../lib/i18n';
import { festivalDoneToday, festivalFor, milestone, streak, weeklyGoal } from '../lib/habits';
import type { Tithi } from '../lib/panchang';
import type { KarmaAction } from '../lib/types';
import type { Announcement } from '../lib/community';
import { Icon } from './Icon';

/** The reasons to come back: the owner's message, today's streak, the weekly goal and a festival challenge when one is on. */
export function HabitStrip({
  actions, today, goal, tithi, announcement,
}: { actions: KarmaAction[]; today: string; goal: number; tithi: Tithi | null; announcement: Announcement | null }) {
  const { t, num, lang } = useI18n();
  const days = streak(actions, today);
  const mile = milestone(days);
  const wg = weeklyGoal(actions, today, goal);
  const fest = festivalFor(tithi);
  const festDone = fest ? festivalDoneToday(actions, today, fest) : false;
  const note = announcement ? announcement.message[lang] || announcement.message.en : '';

  return (
    <div className="space-y-3">
      {note && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-indigo-soft px-4 py-3 text-indigo" data-testid="announcement">
          <Icon name="bell" size={18} className="mt-0.5 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{note}</span>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="card !p-4" aria-label={t('habit.streak_label')} data-testid="streak">
          <p className="flex items-center gap-2 font-display text-3xl font-bold leading-tight">
            <Icon name="krodh" size={26} className="text-saffron-text" />
            {days > 0 ? t('habit.streak', { n: num(days) }) : t('habit.streak_zero')}
          </p>
          <p className="mt-1 text-sm text-muted">{mile ? t(`habit.milestone_${mile}`) : t('habit.streak_hint')}</p>
        </section>

        <section className="card !p-4" aria-label={t('habit.goal_title')} data-testid="weekly-goal">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold">{t('habit.goal_title')}</h2>
            <span className="text-sm font-semibold text-good">{t('habit.goal_progress', { points: num(wg.points), goal: num(wg.goal) })}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={wg.goal} aria-valuenow={Math.min(wg.points, wg.goal)}>
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-saffron transition-all" style={{ width: `${Math.max(wg.points > 0 ? 4 : 0, wg.fraction * 100)}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">{wg.reached ? t('habit.goal_done') : t('habit.goal_left', { n: num(wg.goal - wg.points) })}</p>
        </section>
      </div>

      {fest && (
        <section className="rounded-3xl border border-saffron/50 bg-gold/15 p-4" data-testid="festival">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold leading-tight">{t(`festival.${fest.id}.title`)}</h2>
              <p className="mt-1 text-sm">{t(`festival.${fest.id}.body`)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${festDone ? 'bg-good text-white' : 'bg-card text-muted'}`}>
              {festDone ? t('festival.done') : t('festival.todo')}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
