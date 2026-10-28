import { useI18n } from '../lib/i18n';
import { shlokaMeaning, shlokaOfTheDay, shlokaVerse, type Shloka } from '../content/shlokas';
import { OmChakra } from './SacredArt';
import { ShareButton } from './ShareButton';
import { renderShlokaShareCard, SITE_URL } from '../lib/shareCard';

/**
 * Shloka of the day on a deep indigo and gold panel: the verse in the reader's script (Gujarati script for Gujarati,
 * Devanagari for Hindi and English), a labelled meaning in the selected language, the Hindi meaning, and the reference.
 */
export function ShlokaCard({ date, shloka }: { date: string; shloka?: Shloka }) {
  const { t, lang } = useI18n();
  const s = shloka ?? shlokaOfTheDay(date);
  const verse = shlokaVerse(s, lang);
  const lines = verse.split('\n');
  const verseFont = lang === 'gu' ? 'font-sans' : 'font-deva';

  return (
    <section className="panel-night p-5 sm:p-6" aria-labelledby="shloka-title" data-testid="shloka">
      <OmChakra className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 opacity-20" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h2 id="shloka-title" className="font-display text-2xl font-bold leading-tight text-gold-light">{t('shloka.title')}</h2>
          <span className="shrink-0 rounded-full border border-gold-light/40 bg-white/10 px-3 py-1 text-xs font-semibold text-gold-light">{s.ref.replace('Bhagavad Gita', t('shloka.gita'))}</span>
        </div>

        {/* the verse */}
        <div className="mt-4 rounded-2xl border border-gold-light/30 bg-white/[0.06] px-4 py-5 text-center">
          <p lang={lang === 'gu' ? 'gu' : 'sa'} className={`${verseFont} space-y-1 text-lg font-semibold leading-[1.9] text-cream sm:text-xl`}>
            {lines.map((l) => (
              <span key={l} className="block text-balance">{l}</span>
            ))}
          </p>
        </div>

        {/* the meaning, in the selected language */}
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-gold-light/80">{t('shloka.meaning')}</p>
          <p className="mt-1 font-display text-xl leading-relaxed text-cream">{shlokaMeaning(s, lang)}</p>
        </div>

        {lang !== 'hi' && <div className="mt-4 border-t border-gold-light/20 pt-4" lang="hi">
          <p className="text-xs font-semibold tracking-wide text-gold-light/80">{t('shloka.hindi_meaning')}</p>
          <p className="mt-1 font-deva text-base leading-relaxed text-cream/90">{shlokaMeaning(s, 'hi')}</p>
        </div>}

        <div className="mt-4">
          <ShareButton
            className="btn-ghost !border-gold-light/40 !bg-white/10 !text-gold-light"
            label={t('share.shloka')}
            filename="karma-shloka.png"
            url={SITE_URL}
            text={t('share.text_shloka')}
            build={() => renderShlokaShareCard({
              kicker: t('shloka.title'),
              title: s.ref.replace('Bhagavad Gita', t('shloka.gita')),
              lines,
              meaning: shlokaMeaning(s, lang),
              hindiMeaning: lang === 'hi' ? undefined : shlokaMeaning(s, 'hi'),
              meaningLabel: t('shloka.meaning'),
              hindiMeaningLabel: t('shloka.hindi_meaning'),
              footer: SITE_URL.replace('https://', ''),
              font: lang === 'gu' ? '"Hind Vadodara", sans-serif' : '"Noto Sans Devanagari", sans-serif',
            })}
          />
        </div>
      </div>
    </section>
  );
}
