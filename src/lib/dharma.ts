import rubric from '../../supabase/functions/_shared/rubric.v3.json';
import { principleText } from '../content/principleText';
import { principleMoral } from '../content/principleMoral';
import type { Lang } from './types';

export interface DharmaPrinciple {
  id: string;
  label: string;
  type: 'punya' | 'paap';
  range: [number, number];
  category: string;
  source: string;
  about: string;
  /** what the cited text teaches, in plain words (filled by localizedPrinciple) */
  moral?: string;
}

export const DHARMA_VERSION: string = rubric.version;
export const PRINCIPLES = rubric.principles as DharmaPrinciple[];

/** The dharma principle (and its source) behind a score, or undefined for unknown ids. */
export function getPrinciple(id: string | undefined): DharmaPrinciple | undefined {
  return id ? PRINCIPLES.find((p) => p.id === id) : undefined;
}

/** The principle with its label, description and source in the selected language. */
export function localizedPrinciple(p: DharmaPrinciple, lang: Lang): DharmaPrinciple {
  const t = principleText(p.id, lang);
  const moral = principleMoral(p.id, lang);
  return { ...p, ...(t ? { label: t.label, about: t.about, source: t.source } : {}), moral };
}
