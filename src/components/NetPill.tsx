import { Icon } from './Icon';
import { useI18n } from '../lib/i18n';

export function NetPill({ net, label, trend }: { net: number; label: string; trend?: number }) {
  const { t, num } = useI18n();
  const dir = (trend ?? net) > 0 ? 'up' : (trend ?? net) < 0 ? 'down' : 'flat';
  const word = dir === 'up' ? t('home.trend_up') : dir === 'down' ? t('home.trend_down') : t('home.trend_flat');
  return (
    <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-line bg-card px-5 py-2 shadow-soft" data-testid="net-pill">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-xl font-bold text-ink">
        {net > 0 ? '+' : net < 0 ? '−' : ''}
        {num(Math.abs(net))}
      </span>
      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${dir === 'down' ? 'text-indigo' : 'text-saffron-text'}`}>
        <Icon name={dir} size={16} />
        {word}
      </span>
    </div>
  );
}
