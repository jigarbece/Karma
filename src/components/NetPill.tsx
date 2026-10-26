import { Icon } from './Icon';
import { useI18n } from '../lib/i18n';

export function NetPill({ net, label, trend, tone = 'day' }: { net: number; label: string; trend?: number; tone?: 'day' | 'night' }) {
  const { t, num } = useI18n();
  const dir = (trend ?? net) > 0 ? 'up' : (trend ?? net) < 0 ? 'down' : 'flat';
  const word = dir === 'up' ? t('home.trend_up') : dir === 'down' ? t('home.trend_down') : t('home.trend_flat');
  const night = tone === 'night';
  return (
    <div
      className={`mx-auto flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border px-5 py-2 ${
        night ? 'border-gold-light/30 bg-white/10 text-cream backdrop-blur' : 'border-line bg-card shadow-soft'
      }`}
      data-testid="net-pill"
    >
      <span className={`text-sm ${night ? 'text-cream/80' : 'text-muted'}`}>{label}</span>
      <span className={`font-display text-3xl font-bold leading-none ${night ? 'text-gold-light' : 'text-ink'}`}>
        {net > 0 ? '+' : net < 0 ? '−' : ''}
        {num(Math.abs(net))}
      </span>
      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${night ? (dir === 'down' ? 'text-lavender' : 'text-gold-light') : dir === 'down' ? 'text-indigo' : 'text-saffron-text'}`}>
        <Icon name={dir} size={16} />
        {word}
      </span>
    </div>
  );
}
