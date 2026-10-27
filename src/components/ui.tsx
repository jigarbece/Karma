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
      <h1 className="text-3xl font-bold leading-tight text-ink lg:text-4xl">{children}</h1>
      {sub ? <p className="mt-1 text-muted">{sub}</p> : null}
      <div className="gold-rule mt-3 max-w-xs" aria-hidden="true" />
    </header>
  );
}

/** i18n key for how an item was meant (a thought, only an intention, held back, repentance); null for an ordinary deed. */
export function modeKey(a: Pick<KarmaAction, 'mode' | 'type'>): string | null {
  switch (a.mode) {
    case 'thought': return a.type === 'punya' ? 'mode.thought_punya' : 'mode.thought_paap';
    case 'intended': return 'mode.intended';
    case 'refrained': return 'mode.refrained';
    case 'regret': return 'mode.regret';
    default: return null;
  }
}

/**
 * One scored act as a compact row: icon, the act (masked), its points and an eye button.
 * The text is hidden by default; the eye reveals the act, its reason and the dharma principle behind the points
 * for a few seconds. No hint text is repeated on every row.
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
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(false), 8000);
    return () => clearTimeout(timer);
  }, [shown]);

  const tone = neutral ? 'text-muted' : punya ? 'text-good' : 'text-paapred';
  return (
    <li className="min-w-0 rounded-2xl border border-line/70 bg-card/90 px-3 py-2 shadow-soft [overflow-wrap:anywhere]">
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            neutral ? 'bg-line text-muted' : punya ? 'bg-gold/25 text-saffron-text' : 'bg-indigo-soft text-indigo'
          }`}
        >
          <Icon name={shown ? CATEGORY_ICON[a.category] : 'lotus'} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          {shown ? (
            <p className="text-sm font-semibold leading-snug" data-testid="act-text">{summary}</p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-semibold leading-snug" data-testid="masked-act">
              <Icon name="lock" size={14} className="shrink-0 text-saffron-text" />
              <span aria-hidden="true" className="tracking-[0.25em] text-muted">••••••••</span>
              <span className="sr-only">{t('act.masked')}</span>
            </p>
          )}
          <p className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${punya ? 'text-saffron-text' : neutral ? 'text-muted' : 'text-indigo'}`}>
            <Icon name={punya ? 'up' : neutral ? 'flat' : 'down'} size={12} />
            {t(punya ? 'talk.type_punya' : neutral ? 'talk.type_neutral' : 'talk.type_paap')}
            {modeKey(a) && <span className="font-normal" data-testid="mode-tag">· {t(modeKey(a)!)}</span>}
            {shown && <span className="font-normal text-muted">· {t(`cat.${a.category}`)}</span>}
          </p>
        </div>

        <span className={`shrink-0 font-display text-2xl font-bold leading-none ${tone}`} aria-label={`${w > 0 ? '+' : '−'}${Math.abs(w)} ${t('common.points')}`}>
          {w > 0 ? '+' : w < 0 ? '−' : ''}
          {num(Math.abs(w))}
        </span>

        <button
          type="button"
          aria-pressed={shown}
          aria-label={shown ? t('act.hide') : t('act.show')}
          title={shown ? t('act.hide') : t('act.show')}
          onClick={() => setShown((s) => !s)}
          className="-mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-saffron-text transition hover:bg-sand/60"
        >
          <Icon name={shown ? 'eyeoff' : 'eye'} size={20} />
        </button>
      </div>

      {shown && (
        <div className="mt-1 space-y-1.5 border-t border-line/60 pt-2 text-sm">
          {reason && <p>{reason}</p>}
          {principle && (
            <p className="inline-flex flex-wrap items-baseline gap-x-2 rounded-xl bg-sand/60 px-3 py-1" data-testid="basis">
              <span className="font-display text-base font-bold">{principle.label}</span>
              <span className="text-xs text-muted">{principle.source}</span>
            </p>
          )}
          {children}
        </div>
      )}
    </li>
  );
}
