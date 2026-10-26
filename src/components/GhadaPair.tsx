import { Ghada } from './Ghada';
import { fillFraction } from '../lib/ghada';
import { useI18n } from '../lib/i18n';
import type { Range } from '../lib/types';

/** Two ghadas with exact numbers beside them (never colour alone). `tone="night"` is for dark hero panels. */
export function GhadaPair({ punya, paap, range, tone = 'day' }: { punya: number; paap: number; range: Range; tone?: 'day' | 'night' }) {
  const { t, num } = useI18n();
  const fp = fillFraction(punya, range);
  const fq = fillFraction(paap, range);
  const pctP = Math.round(fp * 100);
  const pctQ = Math.round(fq * 100);
  const night = tone === 'night';
  const cPunya = night ? 'text-gold-light' : 'text-saffron-text';
  const cPaap = night ? 'text-lavender' : 'text-indigo';
  const cMuted = night ? 'text-cream/80' : 'text-muted';
  return (
    <div className="grid grid-cols-2 gap-3">
      <figure className="flex flex-col items-center">
        <Ghada kind="punya" fraction={fp} className="w-full max-w-[170px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.punya_ghada'), value: punya, pct: pctP })} />
        <figcaption className="-mt-1 text-center">
          <div className={`text-sm font-semibold ${cPunya}`}>{t('home.punya_ghada')}</div>
          <div className={`font-display text-4xl font-bold leading-none ${cPunya}`}>+{num(punya)}</div>
          <div className={`mt-1 text-sm ${cMuted}`}>{t('home.filled', { pct: num(pctP) })}</div>
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center">
        <Ghada kind="paap" fraction={fq} className="w-full max-w-[170px] lg:max-w-[230px]" label={t('home.ghada_label', { kind: t('home.paap_ghada'), value: paap, pct: pctQ })} />
        <figcaption className="-mt-1 text-center">
          <div className={`text-sm font-semibold ${cPaap}`}>{t('home.paap_ghada')}</div>
          <div className={`font-display text-4xl font-bold leading-none ${cPaap}`}>−{num(paap)}</div>
          <div className={`mt-1 text-sm ${cMuted}`}>{t('home.filled', { pct: num(pctQ) })}</div>
        </figcaption>
      </figure>
    </div>
  );
}
