import { useEffect, useState, type ReactNode } from 'react';
import { Icon, CATEGORY_ICON } from './Icon';
import { useI18n } from '../lib/i18n';
import { signedWeight } from '../lib/ghada';
import { getPrinciple, localizedPrinciple } from '../lib/dharma';
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
  const { t, num, lang } = useI18n();
  const w = signedWeight(a);
  const punya = a.type === 'punya';
  const neutral = a.type === 'neutral';
  const base = getPrinciple(a.basis);
  const principle = base ? localizedPrinciple(base, lang) : undefined;
  // text in the selected language; older entries without translations keep their original wording
  const tr = a.translations?.[lang];
  const summary = tr?.summary || a.summary;
  const reason = tr?.reason || a.reason;
  // What the person did is private: hidden by default, shown only on a deliberate tap, then hidden again.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(false), 8000);
    return () => clearTimeout(timer);
  }, [shown]);
  return (
    <li className="card flex min-w-0 gap-3 !p-4 [overflow-wrap:anywhere]">
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
          neutral ? 'bg-line text-muted' : punya ? 'bg-gold/25 text-saffron-text' : 'bg-indigo-soft text-indigo'
        }`}
      >
        <Icon name={shown ? CATEGORY_ICON[a.category] : 'lotus'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          {shown ? (
            <p className="font-semibold leading-snug" data-testid="act-text">{summary}</p>
          ) : (
            <p className="flex items-center gap-2 font-semibold leading-snug" data-testid="masked-act">
              <Icon name="lock" size={16} className="shrink-0 text-saffron-text" />
              <span aria-hidden="true" className="tracking-[0.25em] text-muted">••••••••••••</span>
              <span className="sr-only">{t('act.masked')}</span>
            </p>
          )}
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
          {shown && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t(`cat.${a.category}`)}</span>
            </>
          )}
        </div>
        {shown ? (
          reason ? <p className="mt-1 text-sm">{reason}</p> : null
        ) : (
          <p className="mt-1 text-sm text-muted">{t('act.masked_hint')}</p>
        )}
        {shown && principle && (
          <p className="mt-2 inline-flex flex-wrap items-baseline gap-x-2 rounded-xl bg-sand/60 px-3 py-1.5 text-sm" data-testid="basis">
            <span className="font-display text-base font-bold">{principle.label}</span>
            <span className="text-muted">{principle.source}</span>
          </p>
        )}
        <button
          type="button" aria-pressed={shown} onClick={() => setShown((s) => !s)}
          className="mt-1 mr-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-saffron-text"
        >
          <Icon name={shown ? 'eyeoff' : 'eye'} size={16} />
          {shown ? t('act.hide') : t('act.show')}
        </button>
        {children}
      </div>
    </li>
  );
}
