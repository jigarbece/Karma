import rubric from '../../supabase/functions/_shared/rubric.v2.json';

export interface DharmaPrinciple {
  id: string;
  label: string;
  type: 'punya' | 'paap';
  range: [number, number];
  category: string;
  source: string;
  about: string;
}

export const DHARMA_VERSION: string = rubric.version;
export const PRINCIPLES = rubric.principles as DharmaPrinciple[];

/** The dharma principle (and its source) behind a score, or undefined for unknown ids. */
export function getPrinciple(id: string | undefined): DharmaPrinciple | undefined {
  return id ? PRINCIPLES.find((p) => p.id === id) : undefined;
}
