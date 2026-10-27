import { useMemo } from 'react';
import { panchangFor, type PanchangDay } from './astro';
import { formatTithi, tithiForNow } from './panchang';
import type { Lang } from './types';

/** Today's tithi line (e.g. "આસો સુદ ૧૫"), recomputed when the language or local date changes. */
export function useTithi(lang: Lang, today: string): string {
  return useMemo(() => {
    try {
      return formatTithi(tithiForNow(new Date()), lang);
    } catch {
      return '';
    }
    // `today` re-computes the tithi after midnight in a long-lived session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, today]);
}

/** Vara, tithi, nakshatra and rashi for today, or null if the calculation fails. */
export function usePanchang(lang: Lang, today: string): PanchangDay | null {
  return useMemo(() => {
    try {
      return panchangFor(new Date(), today, lang);
    } catch {
      return null;
    }
  }, [lang, today]);
}
