import { useMemo } from 'react';
import { formatTithi, tithiForNow, type Tithi } from './panchang';
import type { Lang } from './types';

/**
 * Today's tithi line (e.g. "આસો સુદ ૧૫"). The astronomy runs once per local date; changing the language only
 * re-formats the result, so switching language stays instant.
 */
export function useTithi(lang: Lang, today: string): string {
  const tithi = useMemo<Tithi | null>(() => {
    try {
      return tithiForNow(new Date());
    } catch {
      return null;
    }
    // `today` re-computes the tithi after midnight in a long-lived session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);
  return useMemo(() => (tithi ? formatTithi(tithi, lang) : ''), [tithi, lang]);
}
