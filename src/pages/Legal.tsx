import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LEGAL_UPDATED, PRIVACY, TERMS, type Section } from '../content/legal';
import { DHARMA_VERSION, PRINCIPLES, localizedPrinciple } from '../lib/dharma';

function Doc({ title, sections }: { title: string; sections: Section[] }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  return (
    <article className="mx-auto max-w-prose px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" className="min-h-[44px] font-semibold text-saffron-text" onClick={() => navigate(-1)}>← {t('common.back')}</button>
        <LanguageSwitcher />
      </div>
      <h1 className="mt-2 text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted">{t('legal.updated', { date: LEGAL_UPDATED })}</p>
      <div className="mt-4 space-y-5" lang={lang}>
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-bold">{s.h}</h2>
            <p className="mt-1 leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}

export function Privacy() {
  const { t, lang } = useI18n();
  return <Doc title={t('profile.privacy')} sections={PRIVACY[lang]} />;
}

export function Terms() {
  const { t, lang } = useI18n();
  return <Doc title={t('profile.terms')} sections={TERMS[lang]} />;
}

export function About() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  return (
    <article className="mx-auto max-w-prose px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" className="min-h-[44px] font-semibold text-saffron-text" onClick={() => navigate(-1)}>← {t('common.back')}</button>
        <LanguageSwitcher />
      </div>
      <h1 className="mt-2 text-2xl font-bold">{t('about.title')}</h1>
      <div className="mt-4 space-y-3 leading-relaxed">
        {['about.p1', 'about.p2', 'about.p3', 'about.p4', 'about.p5'].map((k) => <p key={k}>{t(k)}</p>)}
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold">{t('about.rubric')} ({DHARMA_VERSION})</h2>
      <ul className="mt-2 space-y-2">
        {PRINCIPLES.map((base) => localizedPrinciple(base, lang)).map((p) => (
          <li key={p.id} className="card !p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-xl font-bold">{p.label}</span>
              <span className={`shrink-0 text-sm font-semibold ${p.type === 'punya' ? 'text-good' : 'text-indigo'}`}>
                {p.type === 'punya' ? '+' : '−'}{p.range[0]}–{p.range[1]}
              </span>
            </div>
            <div className="text-sm">{p.about}</div>
            <div className="text-sm text-muted">{p.source}</div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">{t('about.panchang')}</p>
      <p className="mt-6"><Link to="/privacy" className="font-semibold text-saffron-text underline">{t('profile.privacy')}</Link></p>
    </article>
  );
}
