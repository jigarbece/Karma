import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import en from '../i18n/en.json';
import gu from '../i18n/gu.json';
import hi from '../i18n/hi.json';
import type { Lang } from './types';
import { toGujaratiDigits } from './panchang';

export type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en, gu, hi };

export const LANG_LABEL: Record<Lang, string> = { gu: 'ગુજરાતી', hi: 'हिंदी', en: 'English' };
export const LOCALE: Record<Lang, string> = { gu: 'gu-IN', hi: 'hi-IN', en: 'en-IN' };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? en[key as keyof typeof en] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

interface I18nValue {
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Format a number; Gujarati numerals in Gujarati mode. */
  num: (n: number | string) => string;
  date: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  t: (k) => k,
  num: (n) => String(n),
  date: (d) => d,
});

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const num = useCallback((n: number | string) => (lang === 'gu' ? toGujaratiDigits(n) : String(n)), [lang]);
  const date = useCallback(
    (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) => {
      const [y, m, d] = iso.split('-').map(Number);
      return new Intl.DateTimeFormat(LOCALE[lang], { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
    },
    [lang],
  );
  const value = useMemo(() => ({ lang, t, num, date }), [lang, t, num, date]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
