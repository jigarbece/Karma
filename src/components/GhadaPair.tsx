import { Ghada } from './Ghada';
import { fillFraction } from '../lib/ghada';
import { useI18n } from '../lib/i18n';
import type { Range } from '../lib/types';

/** Two ghadas with exact numbers beside them (never colour alone). */
export function GhadaPair({ punya, paap, range }: { punya: number; paap: number; range: Range }) {
  const { t, num } = useI18n();
  const fp = fillFraction(punya, range);
  const fq = fillFraction(paap, range);
  const pctP = Math.round(fp * 100);
  const pctQ = Math.round(fq * 100);
  return (
    <div className="grid grid-cols-2 gap-3">
      <figure className="flex flex-col items-center">
        <Ghada kind="punya" fraction={fp} className="w-full max-w-[170px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.punya_ghada'), value: punya, pct: pctP })} />
        <figcaption className="-mt-1 text-center">
          <div className="text-sm font-semibold text-saffron-text">{t('home.punya_ghada')}</div>
          <div className="text-2xl font-bold text-saffron-text">+{num(punya)}</div>
          <div className="text-sm text-muted">{t('home.filled', { pct: num(pctP) })}</div>
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center">
        <Ghada kind="paap" fraction={fq} className="w-full max-w-[170px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.paap_ghada'), value: paap, pct: pctQ })} />
        <figcaption className="-mt-1 text-center">
          <div className="text-sm font-semibold text-indigo">{t('home.paap_ghada')}</div>
          <div className="text-2xl font-bold text-indigo">−{num(paap)}</div>
          <div className="text-sm text-muted">{t('home.filled', { pct: num(pctQ) })}</div>
        </figcaption>
      </figure>
    </div>
  );
}
