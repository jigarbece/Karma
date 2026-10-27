import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon, CATEGORY_ICON } from './Icon';
import { useI18n } from '../lib/i18n';
import { signedWeight } from '../lib/ghada';
import { getPrinciple, localizedPrinciple } from '../lib/dharma';
import type { KarmaAction } from '../lib/types';

/**
 * Shown right after Analyse: what was found, Punya versus things to reflect upon, with the points.
 * Act text stays masked until "Show details" is tapped. Closing it (button, backdrop or Esc) hands control back
 * to the page, which then brings the two ghadas into view. A bottom sheet on phones, a centred card on wider screens.
 */
export function AnalysisDialog({ actions, onClose }: { actions: KarmaAction[]; onClose: () => void }) {
  const { t, num, lang } = useI18n();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState(false);

  const scored = useMemo(() => actions.filter((a) => a.type !== 'neutral'), [actions]);
  const punya = scored.filter((a) => a.type === 'punya').reduce((s, a) => s + Math.abs(signedWeight(a)), 0);
  const growth = scored.filter((a) => a.type !== 'punya').reduce((s, a) => s + Math.abs(signedWeight(a)), 0);

  useEffect(() => {
    ctaRef.current?.focus();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // keep keyboard focus inside the dialog
      const items = [...panelRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = scroll;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const fade = { duration: reduceMotion ? 0 : 0.22 };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-night/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fade}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="analysis-dialog"
        className="relative flex max-h-[88dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-4xl bg-card shadow-lift sm:max-w-lg sm:rounded-4xl"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...fade, ease: 'easeOut' }}
      >
        <div className="px-5 pb-3 pt-5">
          <h2 id={titleId} className="font-display text-2xl font-bold leading-tight sm:text-3xl">{t('dlg.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('dlg.count', { n: num(scored.length) })}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5">
          <div className="min-w-0 rounded-2xl bg-gold/20 px-3 py-2.5" data-testid="dlg-punya">
            <p className="text-xs font-semibold text-saffron-text">{t('talk.type_punya')}</p>
            <p className="font-display text-3xl font-bold leading-none text-good">+{num(punya)}</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-indigo-soft px-3 py-2.5" data-testid="dlg-growth">
            <p className="text-xs font-semibold text-indigo">{t('dlg.growth')}</p>
            <p className="font-display text-3xl font-bold leading-none text-paapred">{growth > 0 ? '−' : ''}{num(growth)}</p>
          </div>
        </div>
        {growth === 0 && <p className="px-5 pt-3 text-sm font-semibold text-good">{t('dlg.no_growth')}</p>}

        <ul className="scroll-y mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-1" aria-label={t('talk.today_entries')}>
          {scored.map((a) => {
            const isPunya = a.type === 'punya';
            const tr = a.translations?.[lang];
            const base = getPrinciple(a.basis);
            const principle = base ? localizedPrinciple(base, lang) : undefined;
            const w = Math.abs(signedWeight(a));
            return (
              <li key={a.id} className="min-w-0 rounded-2xl border border-line/70 bg-card px-3 py-2 [overflow-wrap:anywhere]">
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isPunya ? 'bg-gold/25 text-saffron-text' : 'bg-indigo-soft text-indigo'}`}>
                    <Icon name={details ? CATEGORY_ICON[a.category] : 'lotus'} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {details ? (
                      <p className="text-sm font-semibold leading-snug" data-testid="dlg-act">{tr?.summary || a.summary}</p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm font-semibold leading-snug" data-testid="dlg-masked">
                        <Icon name="lock" size={14} className="shrink-0 text-saffron-text" />
                        <span aria-hidden="true" className="tracking-[0.25em] text-muted">••••••••</span>
                        <span className="sr-only">{t('act.masked')}</span>
                      </p>
                    )}
                    <p className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${isPunya ? 'text-saffron-text' : 'text-indigo'}`}>
                      <Icon name={isPunya ? 'up' : 'down'} size={12} />
                      {t(isPunya ? 'talk.type_punya' : 'talk.type_paap')}
                    </p>
                  </div>
                  <span className={`shrink-0 font-display text-2xl font-bold leading-none ${isPunya ? 'text-good' : 'text-paapred'}`}>
                    {isPunya ? '+' : '−'}{num(w)}
                  </span>
                </div>
                {details && (tr?.reason || a.reason || principle) && (
                  <div className="mt-1 space-y-1.5 border-t border-line/60 pt-2 text-sm">
                    {(tr?.reason || a.reason) && <p>{tr?.reason || a.reason}</p>}
                    {principle && <p className="font-display text-base font-bold">{principle.label} <span className="font-sans text-xs font-normal text-muted">{principle.source}</span></p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-3 border-t border-line/70 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" className="btn-ghost shrink-0 max-[419px]:!px-3" aria-pressed={details} onClick={() => setDetails((d) => !d)}>
            <Icon name={details ? 'eyeoff' : 'eye'} size={20} />
            <span className="max-[419px]:sr-only">{details ? t('dlg.hide') : t('dlg.show')}</span>
          </button>
          <button ref={ctaRef} type="button" className="btn-primary min-w-0 flex-1" onClick={onClose}>{t('dlg.cta')}</button>
        </div>
      </motion.div>
    </div>
  );
}
