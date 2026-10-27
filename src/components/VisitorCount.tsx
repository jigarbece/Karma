import { Icon } from './Icon';
import { useI18n } from '../lib/i18n';
import { useVisitorCount } from '../lib/visitors';

/** A small, quiet "N visitors" line for the bottom of a page. Renders nothing until the count is known. */
export function VisitorCount({ className = '' }: { className?: string }) {
  const { t, num } = useI18n();
  const n = useVisitorCount();
  if (n === null) return null;
  return (
    <p
      className={`inline-flex items-center gap-1.5 text-xs text-muted ${className}`}
      data-testid="visitor-count"
      aria-label={t('visitors.aria', { n: new Intl.NumberFormat('en-IN').format(n) })}
    >
      <Icon name="family" size={14} className="text-saffron-text" />
      <span>{t('visitors.count', { n: num(new Intl.NumberFormat('en-IN').format(n)) })}</span>
    </p>
  );
}
