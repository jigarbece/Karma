import { Ghada } from './Ghada';
import { fillFraction } from '../lib/ghada';
import { useI18n } from '../lib/i18n';
import type { Range } from '../lib/types';

/**
 * Two ghadas: a ribbon title, the pot (with % on its medallion) and an exact-number card below.
 * Never colour alone: every value has a sign, a label and a percent.
 */
export function GhadaPair({ punya, paap, range }: { punya: number; paap: number; range: Range }) {
  const { t, num } = useI18n();
  const fp = fillFraction(punya, range);
  const fq = fillFraction(paap, range);
  const pctP = Math.round(fp * 100);
  const pctQ = Math.round(fq * 100);
  return (
    <div className="grid grid-cols-2 items-end gap-3 sm:gap-6">
      <figure className="flex flex-col items-center">
        <span className="tag-ribbon relative z-10 -mb-1 text-base sm:text-lg">{t('home.punya_ghada')}</span>
        <Ghada kind="punya" fraction={fp} className="w-full max-w-[190px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.punya_ghada'), value: punya, pct: pctP })} />
        <figcaption className="value-card -mt-3 w-[88%] max-w-[210px]">
          <div className="font-display text-3xl font-bold leading-none text-good lg:text-4xl">+{num(punya)}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted sm:text-sm">{t('home.good_points')}</div>
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center">
        <span className="tag-ribbon relative z-10 -mb-1 text-base sm:text-lg">{t('home.paap_ghada')}</span>
        <Ghada kind="paap" fraction={fq} className="w-full max-w-[190px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.paap_ghada'), value: paap, pct: pctQ })} />
        <figcaption className="value-card -mt-3 w-[88%] max-w-[210px]">
          <div className="font-display text-3xl font-bold leading-none text-indigo lg:text-4xl">−{num(paap)}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted sm:text-sm">{t('home.cleanse')}</div>
        </figcaption>
      </figure>
    </div>
  );
}
