import { Icon } from './Icon';
import { useI18n } from '../lib/i18n';

/** "Net karma today" card: big signed number, direction arrow in a circle, one-line encouragement and a quote. */
export function NetCard({ net, label, trend }: { net: number; label: string; trend: number }) {
  const { t, num } = useI18n();
  const dir = net > 0 ? 'up' : net < 0 ? 'down' : 'flat';
  const msg = net > 0 ? t('home.positive_step') : net < 0 ? t('home.growth_step') : t('home.steady_step');
  const tone = dir === 'down' ? 'text-indigo' : 'text-good';
  const trendWord = trend > 0 ? t('home.trend_up') : trend < 0 ? t('home.trend_down') : t('home.trend_flat');
  return (
    <div className="value-card !rounded-3xl !px-5 !py-4" data-testid="net-pill">
      <div className="font-display text-xl font-bold text-ink">{label}</div>
      <div className="mt-1 flex items-center justify-center gap-3">
        <span className={`font-display text-6xl font-bold leading-none ${tone}`}>
          {net > 0 ? '+' : net < 0 ? '−' : ''}
          {num(Math.abs(net))}
        </span>
        <span className={`grid h-12 w-12 place-items-center rounded-full bg-gold/15 ${tone}`} aria-label={trendWord} role="img">
          <Icon name={dir === 'flat' ? 'flat' : dir === 'up' ? 'trend' : 'trenddown'} size={28} />
        </span>
      </div>
      <div className={`mt-1 font-display text-lg font-semibold ${tone}`}>{msg}</div>
      <div className="gold-rule my-2" aria-hidden="true" />
      <p className="font-display text-sm italic leading-snug text-muted">“{t('home.net_quote')}”</p>
    </div>
  );
}
