import { useMemo } from 'react';
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
