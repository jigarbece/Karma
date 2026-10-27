import type { ReactNode } from 'react';
import { Icon, CATEGORY_ICON } from './Icon';
import { useI18n } from '../lib/i18n';
import { signedWeight } from '../lib/ghada';
import { getPrinciple } from '../lib/dharma';
import type { KarmaAction } from '../lib/types';

export function Segmented<T extends string>({
  value, onChange, options, label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line bg-card/90 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[44px] flex-1 rounded-full px-2 text-sm font-semibold transition ${
            value === o.value ? 'bg-night text-cream shadow' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
      {label}
    </div>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-4">
      <h1 className="text-4xl font-bold leading-tight text-ink lg:text-5xl">{children}</h1>
      {sub ? <p className="mt-1 text-muted lg:text-lg">{sub}</p> : null}
      <div className="gold-rule mt-3 max-w-xs" aria-hidden="true" />
    </header>
  );
}

/**
 * One scored act: what happened, its points (graded 1-50 by the AI), Punya/Paap with an icon,
 * and the dharma principle it was weighed against (with its source).
 */
export function ActionCard({ a, children }: { a: KarmaAction; children?: ReactNode }) {
  const { t, num } = useI18n();
  const w = signedWeight(a);
  const punya = a.type === 'punya';
  const neutral = a.type === 'neutral';
  const principle = getPrinciple(a.basis);
  return (
    <li className="card flex gap-3 !p-4">
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
          neutral ? 'bg-line text-muted' : punya ? 'bg-gold/25 text-saffron-text' : 'bg-indigo-soft text-indigo'
        }`}
      >
        <Icon name={CATEGORY_ICON[a.category]} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold leading-snug">{a.summary}</p>
          <span
            className={`shrink-0 font-display text-3xl font-bold leading-none ${neutral ? 'text-muted' : punya ? 'text-good' : 'text-indigo'}`}
            aria-label={`${w > 0 ? '+' : '−'}${Math.abs(w)} ${t('common.points')}`}
          >
            {w > 0 ? '+' : w < 0 ? '−' : ''}
            {num(Math.abs(w))}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span className={`inline-flex items-center gap-1 font-semibold ${punya ? 'text-saffron-text' : neutral ? '' : 'text-indigo'}`}>
            <Icon name={punya ? 'up' : neutral ? 'flat' : 'down'} size={14} />
            {t(punya ? 'talk.type_punya' : neutral ? 'talk.type_neutral' : 'talk.type_paap')}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t(`cat.${a.category}`)}</span>
        </div>
        {a.reason ? <p className="mt-1 text-sm">{a.reason}</p> : null}
        {principle && (
          <p className="mt-2 inline-flex flex-wrap items-baseline gap-x-2 rounded-xl bg-sand/60 px-3 py-1.5 text-sm" data-testid="basis">
            <span className="font-display text-base font-bold">{principle.label}</span>
            <span className="text-muted">{principle.source}</span>
          </p>
        )}
        {children}
      </div>
    </li>
  );
}
