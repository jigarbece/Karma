import { useI18n } from '../lib/i18n';
import { streak } from '../lib/habits';
import { weeklySummary } from '../lib/weekly';
import { renderShareCard, SITE_URL } from '../lib/shareCard';
import type { KarmaAction } from '../lib/types';
import { ShareButton } from './ShareButton';

/** "This week your punya rose 30%. Your strongest area was seva. One thing to grow: patience." Shareable without private detail. */
export function WeeklySummaryCard({ actions, today }: { actions: KarmaAction[]; today: string }) {
  const { t, num, lang } = useI18n();
  const w = weeklySummary(actions, today);
  const days = streak(actions, today);
  const font = lang === 'hi' ? '"Noto Sans Devanagari", sans-serif' : '"Hind Vadodara", sans-serif';

  if (w.punya === 0 && w.activeDays === 0) {
    return <section className="card" data-testid="weekly-summary"><h2 className="font-display text-2xl font-bold">{t('weekly.title')}</h2><p className="mt-1 text-muted">{t('weekly.empty')}</p></section>;
  }

  const change = w.changePct === null ? t('weekly.change_none') : w.changePct >= 0 ? t('weekly.change_up', { n: num(w.changePct) }) : t('weekly.change_down', { n: num(Math.abs(w.changePct)) });
  // the shared card never carries the "area to grow" or any paap
  const lines = [change, w.strongest ? t('weekly.strongest', { cat: t(`cat.${w.strongest}`) }) : '', days > 0 ? t('habit.streak', { n: num(days) }) : ''].filter(Boolean);

  return (
    <section className="card space-y-2" data-testid="weekly-summary" aria-labelledby="weekly-h">
      <h2 id="weekly-h" className="font-display text-2xl font-bold">{t('weekly.title')}</h2>
      <p className="font-display text-4xl font-bold text-good">+{num(w.punya)} <span className="font-sans text-base font-normal text-muted">{t('share.card_points')}</span></p>
      <ul className="space-y-1">
        <li>{change}</li>
        {w.strongest && <li>{t('weekly.strongest', { cat: t(`cat.${w.strongest}`) })}</li>}
        {w.grow && <li className="text-muted">{t('weekly.grow', { cat: t(`cat.${w.grow}`) })}</li>}
        <li className="text-muted">{t('weekly.days', { n: num(w.activeDays) })}</li>
      </ul>
      <ShareButton
        label={t('share.week')}
        filename="karma-week.png"
        url={SITE_URL}
        text={t('share.text_week', { n: num(w.punya) })}
        build={() => renderShareCard({
          kicker: t('share.card_week_kicker'),
          big: `+${num(w.punya)}`,
          bigLabel: t('share.card_points'),
          fill: Math.min(1, w.punya / 100),
          lines,
          footer: SITE_URL.replace('https://', ''),
          font,
        })}
      />
    </section>
  );
}
