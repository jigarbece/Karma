import { Ghada } from './Ghada';
import { GhadaSmoke } from './GhadaSmoke';
import { fillFraction } from '../lib/ghada';
import { useI18n } from '../lib/i18n';
import type { Range } from '../lib/types';

/** Any points at all show as a little water, so a small score is never an empty pot. */
const MIN_VISIBLE = 0.07;
const level = (points: number, range: Range) => (points > 0 ? Math.max(MIN_VISIBLE, fillFraction(points, range)) : 0);

/**
 * Two glossy ghada cards in the layout of the design demo: kicker, title, pot, caption.
 * The pot is filled in proportion to the points and has the points written on it, never a percentage.
 */
export function GhadaPair({ punya, paap, range }: { punya: number; paap: number; range: Range }) {
  const { t, num } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      <figure className="ghada-card" data-kind="punya">
        <p className="relative text-xs text-muted sm:text-sm">{t('home.punya_kicker')}</p>
        <h3 className="relative font-display text-2xl font-bold leading-tight sm:text-3xl">{t('home.punya_ghada')}</h3>
        <div className="ghada-pot-wrap ghada-pot-wrap--card">
          <Ghada
            kind="punya"
            fraction={level(punya, range)}
            centerText={`+${num(punya)}`}
            className="ghada-pot relative mx-auto mt-1 w-full max-w-[340px]"
            label={t('home.ghada_label', { kind: t('home.punya_ghada'), value: num(punya) })}
          />
          <GhadaSmoke kind="punya" compact />
        </div>
        <figcaption className="relative -mt-2 text-sm font-semibold text-good sm:text-base" data-testid="punya-points">{t('home.good_points')}</figcaption>
      </figure>

      <figure className="ghada-card" data-kind="paap">
        <p className="relative text-xs text-muted sm:text-sm">{t('home.paap_kicker')}</p>
        <h3 className="relative font-display text-2xl font-bold leading-tight sm:text-3xl">{t('home.paap_ghada')}</h3>
        <div className="ghada-pot-wrap ghada-pot-wrap--card">
          <Ghada
            kind="paap"
            fraction={level(paap, range)}
            centerText={`${paap > 0 ? '−' : ''}${num(paap)}`}
            className="ghada-pot relative mx-auto mt-1 w-full max-w-[340px]"
            label={t('home.ghada_label', { kind: t('home.paap_ghada'), value: num(paap) })}
          />
          <GhadaSmoke kind="paap" compact />
        </div>
        <figcaption className="relative -mt-2 text-sm font-semibold text-paapred sm:text-base" data-testid="paap-points">{t('home.cleanse')}</figcaption>
      </figure>
    </div>
  );
}
