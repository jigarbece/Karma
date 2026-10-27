import { Ghada } from './Ghada';
import { fillFraction } from '../lib/ghada';
import { useI18n } from '../lib/i18n';
import type { Range } from '../lib/types';

/**
 * Two glossy ghada cards in the layout of the design demo: kicker, title, pot, big score, caption.
 * Never colour alone: every value has a sign, a label and a percent on the pot.
 */
export function GhadaPair({ punya, paap, range }: { punya: number; paap: number; range: Range }) {
  const { t, num } = useI18n();
  const fp = fillFraction(punya, range);
  const fq = fillFraction(paap, range);
  const pctP = Math.round(fp * 100);
  const pctQ = Math.round(fq * 100);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      <figure className="ghada-card" data-kind="punya">
        <p className="relative text-xs text-muted sm:text-sm">{t('home.punya_kicker')}</p>
        <h3 className="relative font-display text-2xl font-bold leading-tight sm:text-3xl">{t('home.punya_ghada')}</h3>
        <Ghada kind="punya" fraction={fp} className="ghada-pot relative mx-auto mt-1 w-full max-w-[340px]" label={t('home.ghada_label', { kind: t('home.punya_ghada'), value: punya, pct: pctP })} />
        <figcaption className="relative -mt-2">
          <div className="text-3xl font-black text-good sm:text-4xl">+{num(punya)}</div>
          <div className="text-xs text-muted sm:text-sm">{t('home.good_points')}</div>
        </figcaption>
      </figure>

      <figure className="ghada-card" data-kind="paap">
        <p className="relative text-xs text-muted sm:text-sm">{t('home.paap_kicker')}</p>
        <h3 className="relative font-display text-2xl font-bold leading-tight sm:text-3xl">{t('home.paap_ghada')}</h3>
        <Ghada kind="paap" fraction={fq} className="ghada-pot relative mx-auto mt-1 w-full max-w-[340px]" label={t('home.ghada_label', { kind: t('home.paap_ghada'), value: paap, pct: pctQ })} />
        <figcaption className="relative -mt-2">
          <div className="text-3xl font-black text-paapred sm:text-4xl">−{num(paap)}</div>
          <div className="text-xs text-muted sm:text-sm">{t('home.cleanse')}</div>
        </figcaption>
      </figure>
    </div>
  );
}
