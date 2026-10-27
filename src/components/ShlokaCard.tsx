import { useI18n } from '../lib/i18n';
import { shlokaMeaning, shlokaOfTheDay, type Shloka } from '../content/shlokas';
import { OmChakra, PeacockFeather } from './SacredArt';

/** Shloka of the day: Devanagari verse, transliteration and meaning on a deep indigo and gold panel. */
export function ShlokaCard({ date, shloka, compact = false }: { date: string; shloka?: Shloka; compact?: boolean }) {
  const { t, lang } = useI18n();
  const s = shloka ?? shlokaOfTheDay(date);
  return (
    <section className="panel-night p-6 sm:p-8" aria-labelledby="shloka-title" data-testid="shloka">
      <OmChakra className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-30" />
      <PeacockFeather className="pointer-events-none absolute -bottom-6 -left-3 h-44 opacity-60" />
      <div className="relative">
        <h2 id="shloka-title" className="font-display text-2xl font-bold text-gold-light">{t('shloka.title')}</h2>
        <p lang="sa" className={`mt-3 whitespace-pre-line font-deva font-semibold leading-[1.9] text-cream ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
          {s.sa}
        </p>
        <p className="mt-3 whitespace-pre-line text-sm italic leading-relaxed text-cream/80">{s.roman}</p>
        <div className="my-4 h-px bg-gradient-to-r from-gold-light/60 to-transparent" aria-hidden="true" />
        <p className="font-display text-xl leading-relaxed text-cream">{shlokaMeaning(s, lang)}</p>
        <p className="mt-2 text-sm font-semibold text-gold-light">— {s.ref}</p>
      </div>
    </section>
  );
}
