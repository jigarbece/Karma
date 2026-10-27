import type { Category, KarmaType } from './types';
import { addDays } from './ghada';

export interface SampleAction {
  summary: string;
  type: KarmaType;
  category: Category;
  weight: number;
  basis: string;
  reason: string;
  /** Gujarati and Hindi text (English is `summary` / `reason`) */
  i18n: Record<'gu' | 'hi', { summary: string; reason: string }>;
}

const PUNYA: SampleAction[] = [
  { summary: 'Helped a neighbour carry groceries', type: 'punya', category: 'seva', weight: 12, basis: 'paropakara', reason: 'Quiet, unasked help.', i18n: { gu: { summary: 'પાડોશીને કરિયાણું ઉપાડવામાં મદદ કરી', reason: 'શાંતિથી, કહ્યા વિના કરેલી મદદ.' }, hi: { summary: 'पड़ोसी को किराने का सामान उठाने में मदद की', reason: 'चुपचाप, बिना कहे की गई मदद।' } } },
  { summary: 'Fed the birds and a stray dog', type: 'punya', category: 'jeev_daya', weight: 9, basis: 'go_jeev_seva', reason: 'Compassion to living beings.', i18n: { gu: { summary: 'પક્ષીઓ અને રખડતા કૂતરાને ખવડાવ્યું', reason: 'જીવો પ્રત્યે કરુણા.' }, hi: { summary: 'पक्षियों और एक आवारा कुत्ते को खिलाया', reason: 'जीवों के प्रति करुणा।' } } },
  { summary: 'Spent the evening with parents', type: 'punya', category: 'family_duty', weight: 22, basis: 'matri_pitri_seva', reason: 'Gave time to elders.', i18n: { gu: { summary: 'સાંજ માતા-પિતા સાથે વિતાવી', reason: 'વડીલોને સમય આપ્યો.' }, hi: { summary: 'शाम माता-पिता के साथ बिताई', reason: 'बड़ों को समय दिया।' } } },
  { summary: 'Donated food to a local food drive', type: 'punya', category: 'daan', weight: 28, basis: 'annadana', reason: 'Feeding the hungry carries great merit.', i18n: { gu: { summary: 'સ્થાનિક ભોજન અભિયાનમાં અન્નદાન કર્યું', reason: 'ભૂખ્યાને ભોજન આપવાનું મહાન પુણ્ય છે.' }, hi: { summary: 'स्थानीय भोजन अभियान में अन्नदान किया', reason: 'भूखों को भोजन देना महान पुण्य है।' } } },
  { summary: 'Told the truth about a mistake at work', type: 'punya', category: 'satya', weight: 24, basis: 'satya', reason: 'Honesty had a personal cost.', i18n: { gu: { summary: 'કામમાં થયેલી ભૂલ વિશે સત્ય કહ્યું', reason: 'પ્રામાણિકતાની કિંમત ચૂકવવી પડી.' }, hi: { summary: 'काम में हुई भूल के बारे में सच बताया', reason: 'ईमानदारी की कीमत चुकानी पड़ी।' } } },
  { summary: 'Morning prayer and Gita reading', type: 'punya', category: 'gratitude_bhakti', weight: 7, basis: 'bhakti_sadhana', reason: 'Steady daily practice.', i18n: { gu: { summary: 'સવારની પ્રાર્થના અને ગીતા વાંચન', reason: 'નિયમિત દૈનિક સાધના.' }, hi: { summary: 'सुबह की प्रार्थना और गीता पाठ', reason: 'नियमित दैनिक साधना।' } } },
  { summary: 'Stayed calm during a heated discussion', type: 'punya', category: 'krodh', weight: 15, basis: 'kshama', reason: 'Patience under provocation.', i18n: { gu: { summary: 'ગરમાગરમ ચર્ચા દરમિયાન શાંત રહ્યા', reason: 'ઉશ્કેરાટમાં પણ ધીરજ.' }, hi: { summary: 'गरमागरम चर्चा के दौरान शांत रहे', reason: 'उकसावे में भी धैर्य।' } } },
  { summary: 'Finished work honestly and on time', type: 'punya', category: 'honesty_work', weight: 11, basis: 'svadharma', reason: 'Duty done with care.', i18n: { gu: { summary: 'કામ પ્રામાણિકતાથી અને સમયસર પૂરું કર્યું', reason: 'ફરજ કાળજીથી નિભાવી.' }, hi: { summary: 'काम ईमानदारी से और समय पर पूरा किया', reason: 'कर्तव्य सावधानी से निभाया।' } } },
  { summary: 'Skipped late-night snacks and slept early', type: 'punya', category: 'discipline_health', weight: 5, basis: 'dama_shaucha', reason: 'Self-control.', i18n: { gu: { summary: 'મોડી રાતનો નાસ્તો છોડ્યો અને વહેલા સૂઈ ગયા', reason: 'આત્મસંયમ.' }, hi: { summary: 'देर रात का नाश्ता छोड़ा और जल्दी सोए', reason: 'आत्म-संयम।' } } },
];
const PAAP: SampleAction[] = [
  { summary: 'Snapped at a family member', type: 'paap', category: 'krodh', weight: 13, basis: 'krodha', reason: 'Anger acted upon.', i18n: { gu: { summary: 'પરિવારના સભ્ય પર ગુસ્સે થયા', reason: 'ગુસ્સામાં વર્ત્યા.' }, hi: { summary: 'परिवार के सदस्य पर बरस पड़े', reason: 'क्रोध में व्यवहार किया।' } } },
  { summary: 'Gossiped about a colleague', type: 'paap', category: 'vani', weight: 9, basis: 'parusha_vani', reason: 'Harsh speech about someone absent.', i18n: { gu: { summary: 'સહકર્મી વિશે ગપસપ કરી', reason: 'ગેરહાજર વ્યક્તિ વિશે કઠોર વાણી.' }, hi: { summary: 'सहकर्मी के बारे में गपशप की', reason: 'अनुपस्थित व्यक्ति के बारे में कठोर वाणी।' } } },
  { summary: 'Told a small lie to avoid a task', type: 'paap', category: 'satya', weight: 6, basis: 'asatya', reason: 'A small untruth.', i18n: { gu: { summary: 'કામ ટાળવા નાનું જૂઠું બોલ્યા', reason: 'એક નાનું અસત્ય.' }, hi: { summary: 'काम टालने के लिए छोटा झूठ बोला', reason: 'एक छोटा असत्य।' } } },
  { summary: 'Wasted the morning on the phone', type: 'paap', category: 'discipline_health', weight: 5, basis: 'pramada_vyasana', reason: 'Lack of self-discipline.', i18n: { gu: { summary: 'સવાર ફોનમાં વેડફી', reason: 'સ્વ-શિસ્તમાં ઉણપ.' }, hi: { summary: 'सुबह फ़ोन में गँवा दी', reason: 'आत्म-अनुशासन में कमी।' } } },
  { summary: 'Ignored a request for help', type: 'paap', category: 'seva', weight: 7, basis: 'seva_upeksha', reason: 'A missed chance to help.', i18n: { gu: { summary: 'મદદની વિનંતીને અવગણી', reason: 'મદદ કરવાની તક ચૂક્યા.' }, hi: { summary: 'मदद के अनुरोध को अनदेखा किया', reason: 'मदद का अवसर चूक गए।' } } },
];

/** Deterministic sample history for demo mode and the seed script. Points vary per act. */
export function sampleHistory(today: string, days = 30): Array<SampleAction & { date: string }> {
  const out: Array<SampleAction & { date: string }> = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const jitter = (a: SampleAction): SampleAction => ({ ...a, weight: Math.max(1, a.weight + Math.floor(rnd() * 7) - 3) });
  for (let i = days - 1; i >= 1; i--) {
    const date = addDays(today, -i);
    const nP = 1 + Math.floor(rnd() * 3);
    const nQ = rnd() < 0.6 ? 1 : 0;
    for (let k = 0; k < nP; k++) out.push({ ...jitter(PUNYA[Math.floor(rnd() * PUNYA.length)]), date });
    for (let k = 0; k < nQ; k++) out.push({ ...jitter(PAAP[Math.floor(rnd() * PAAP.length)]), date });
  }
  // Today: a small starting point
  out.push({ ...PUNYA[0], date: today }, { ...PUNYA[5], date: today }, { ...PAAP[0], date: today });
  return out;
}
