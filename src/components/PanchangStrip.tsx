import { Icon } from './Icon';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/app';
import { usePanchang } from '../lib/useTithi';

/**
 * Today's panchang (vara, tithi, nakshatra, chandra rashi) and a traditional line of guidance for the weekday's graha.
 * Computed on the device for Ahmedabad using the Lahiri ayanamsa; for guidance only.
 */
export function PanchangStrip() {
  const { t, num, lang } = useI18n();
  const { today } = useApp();
  const p = usePanchang(lang, today);
  if (!p) return null;
  const items = [
    { k: 'panchang.vara', v: `${p.vara} · ${p.graha}`, icon: 'sun' },
    { k: 'panchang.tithi', v: p.tithi, icon: 'moon', testid: 'tithi' },
    { k: 'panchang.nakshatra', v: `${p.nakshatra} · ${num(p.pada)}`, icon: 'sparkle' },
    { k: 'panchang.rashi', v: p.rashi, icon: 'lotus' },
  ];
  return (
    <section aria-labelledby="pn" className="card !p-4">
      <h2 id="pn" className="sr-only">{t('panchang.title')}</h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-4">
        {items.map((i) => (
          <li key={i.k} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-saffron-text"><Icon name={i.icon} size={20} /></span>
            <div className="min-w-0">
              <div className="text-xs text-muted">{t(i.k)}</div>
              <div className="font-display text-lg font-bold leading-tight" data-testid={i.testid}>{i.v}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex gap-2 rounded-xl bg-sand/60 px-3 py-2 text-sm">
        <Icon name="bhakti" size={18} className="mt-0.5 shrink-0 text-saffron-text" />
        <span>
          <span className="font-semibold">{t('panchang.guidance')}: </span>
          {t(`vara.tip.${p.varaIndex}`)}
        </span>
      </p>
    </section>
  );
}
