import { useApp } from '../lib/app';
import { LANG_LABEL, useI18n } from '../lib/i18n';
import type { Lang } from '../lib/types';

/** Always-visible language picker. Saves to the profile when signed in, otherwise remembers locally. */
export function LanguageSwitcher({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { profile, updateProfile, setLangPreview } = useApp();
  const { lang } = useI18n();

  const choose = (l: Lang) => {
    setLangPreview(l);
    if (profile && l !== profile.language) updateProfile({ language: l }).catch(() => undefined);
  };

  return (
    <div role="group" aria-label="Language / ભાષા / भाषा" className={`flex gap-0.5 ${className}`}>
      {(['gu', 'hi', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={`min-h-[44px] rounded-full text-sm font-semibold ${compact ? 'min-w-[40px] px-2' : 'min-w-[44px] px-3'} ${
            lang === l ? 'bg-night text-cream' : 'text-muted hover:bg-indigo-soft'
          }`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
