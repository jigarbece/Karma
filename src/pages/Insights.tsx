import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';
import { categoryTotals, growthCategory, hasActivity, strongestCategory, trendPoints, type InsightRange } from '../lib/insights';
import type { Category } from '../lib/types';
import { CategoryBars, CategoryRadar, HighlightTile, TrendChart } from '../components/charts';
import { Icon } from '../components/Icon';
import { PageTitle, Segmented } from '../components/ui';

/** Graphics only: where you did well, where to grow, and how net karma moves. */
export default function Insights() {
  const { t, num, date } = useI18n();
  const { actions, today } = useApp();
  const [range, setRange] = useState<InsightRange>('week');

  const rows = useMemo(() => categoryTotals(actions, range, today), [actions, range, today]);
  const everything = useMemo(() => hasActivity(categoryTotals(actions, 'lifetime', today)), [actions, today]);
  const points = useMemo(() => trendPoints(actions, range, today), [actions, range, today]);
  const strong = strongestCategory(rows);
  const care = growthCategory(rows);
  const name = (c: Category) => t(`cat.${c}`);
  const dateLabel = (iso: string) => date(iso, { day: 'numeric', month: 'short' });

  if (!everything) {
    return (
      <div className="mx-auto max-w-xl">
        <PageTitle>{t('insights.title')}</PageTitle>
        <div className="card space-y-3 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold/20 text-saffron-text"><Icon name="chart" size={32} /></span>
          <p className="text-muted">{t('insights.empty')}</p>
          <Link to="/" className="btn-primary mx-auto w-fit">{t('journal.write')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle>{t('insights.title')}</PageTitle>

      <div className="max-w-md">
        <Segmented
          label={t('home.range_label')}
          value={range}
          onChange={setRange}
          options={[
            { value: 'week', label: t('common.week') },
            { value: 'month', label: t('common.month') },
            { value: 'lifetime', label: t('common.lifetime') },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HighlightTile tone="good" title={t('insights.strongest')} category={strong?.category} name={strong ? name(strong.category) : '—'} value={`+${num(strong?.punya ?? 0)}`} />
        <HighlightTile tone="care" title={t('insights.needs_care')} category={care?.category} name={care ? name(care.category) : '—'} value={`−${num(care?.paap ?? 0)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card" aria-labelledby="radar">
          <h2 id="radar" className="font-display text-2xl font-bold">{t('insights.radar')}</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-good"><span className="h-3 w-3 rounded-full bg-good" />{t('common.punya')}</span>
            <span className="inline-flex items-center gap-1.5 text-paapred"><span className="h-3 w-3 rounded-full border-2 border-dashed border-paapred" />{t('common.growth_area')}</span>
          </div>
          <CategoryRadar rows={rows} name={name} label={`${t('insights.radar')}: ${rows.filter((r) => r.punya || r.paap).map((r) => `${name(r.category)} +${r.punya} −${r.paap}`).join(', ')}`} />
        </section>

        <section className="card" aria-labelledby="bars">
          <h2 id="bars" className="font-display text-2xl font-bold">{t('insights.bars')}</h2>
          <div className="mb-3 mt-1 flex items-center justify-between text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-paapred"><Icon name="down" size={14} />{t('common.growth_area')}</span>
            <span className="inline-flex items-center gap-1 text-good">{t('common.punya')}<Icon name="up" size={14} /></span>
          </div>
          <CategoryBars rows={rows} name={name} num={num} />
        </section>
      </div>

      <section className="card" aria-labelledby="trend">
        <h2 id="trend" className="font-display text-2xl font-bold">{t('insights.trend')}</h2>
        <TrendChart points={points} labelAt={(p) => dateLabel(p.date)} label={`${t('insights.trend')}: ${points.map((p) => `${dateLabel(p.date)} ${p.net}`).join(', ')}`} />
      </section>
    </div>
  );
}
