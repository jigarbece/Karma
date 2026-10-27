import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { TEACHINGS, type Teaching } from '../lib/teachings';
import { CATEGORIES, type Category } from '../lib/types';
import { CATEGORY_ICON, Icon } from '../components/Icon';
import { PageTitle } from '../components/ui';

const isGita = (t: Teaching) => t.source.includes('Gita');
const isJain = (t: Teaching) => t.traditions.includes('jain') && !t.traditions.includes('hindu_gita');

/** Browse the curated teachings by tradition (Gita / Jain / all), theme and search word. */
export default function Wisdom() {
  const { t, lang } = useI18n();
  const { tradition = 'all' } = useParams();
  const [params, setParams] = useSearchParams();
  const [theme, setTheme] = useState<Category | 'all'>('all');
  const q = (params.get('q') ?? '').trim().toLowerCase();

  const title = tradition === 'gita' ? t('wisdom.gita') : tradition === 'jain' ? t('wisdom.jain') : t('wisdom.all');
  const pool = useMemo(
    () => TEACHINGS.filter((x) => (tradition === 'gita' ? isGita(x) : tradition === 'jain' ? isJain(x) : true)),
    [tradition],
  );
  const shown = pool.filter((x) => {
    if (theme !== 'all' && !x.categories.includes(theme)) return false;
    if (!q) return true;
    return [x.text[lang], x.text.en, x.source, x.sa ?? ''].some((s) => s.toLowerCase().includes(q));
  });
  const themes = CATEGORIES.filter((c) => pool.some((x) => x.categories.includes(c)));

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle sub={t('wisdom.sub')}>{title}</PageTitle>

      <div className="relative">
        <label htmlFor="wq" className="sr-only">{t('wisdom.search')}</label>
        <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="wq" type="search" value={params.get('q') ?? ''} placeholder={t('wisdom.search')}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          className="field pl-12"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t('wisdom.theme_all')}>
        <button type="button" className="chip" aria-pressed={theme === 'all'} onClick={() => setTheme('all')}>{t('wisdom.theme_all')}</button>
        {themes.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={theme === c} onClick={() => setTheme(c)}>
            <Icon name={CATEGORY_ICON[c]} size={18} />{t(`cat.${c}`)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">{t('wisdom.count', { n: shown.length })}</p>

      {shown.length === 0 ? (
        <p className="card mt-2 text-muted">{t('wisdom.empty')}</p>
      ) : (
        <ul className="mt-2 grid gap-4 md:grid-cols-2">
          {shown.map((x) => (
            <li key={x.id} className="card flex flex-col">
              {x.sa && <p className="font-display text-xl italic text-saffron-text">{x.sa}</p>}
              <blockquote className="font-display text-2xl leading-snug">“{x.text[lang]}”</blockquote>
              <p className="mt-3 text-sm font-semibold text-muted">— {x.source}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {x.categories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full bg-sand/70 px-2.5 py-0.5 text-xs font-semibold">
                    <Icon name={CATEGORY_ICON[c as Category]} size={13} />{t(`cat.${c}`)}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
