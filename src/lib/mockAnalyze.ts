import type { AnalysisResult, Category, KarmaType, Lang, Profile } from './types';
import { pickTeaching } from './teachings';

/**
 * Offline keyword analyser used ONLY in demo mode (no Supabase / no AI key).
 * It mimics the shape of the real `analyze-day` response so the UI can be exercised.
 * Real scoring needs the `analyze-day` Edge Function (see README).
 */
interface Rule {
  re: RegExp;
  type: KarmaType;
  category: Category;
  weight: number;
  basis: string;
  text: Record<Lang, string>;
}

const RULES: Rule[] = [
  {
    re: /(helped|help(ed)? (a|an|my|the)|assist|serv(ed|ice)|volunteer|seva|મદદ|સેવા|સહાય|સહકાર|मदद|सेवा|सहायता)/i,
    type: 'punya', category: 'seva', weight: 12, basis: 'paropakara',
    text: { en: 'Helped or served someone', gu: 'કોઈને મદદ કે સેવા કરી', hi: 'किसी की मदद या सेवा की' },
  },
  {
    re: /(donat|charity|gave (money|food|clothes)|alms|દાન|ભિક્ષા|अन्नदान|दान)/i,
    type: 'punya', category: 'daan', weight: 26, basis: 'annadana',
    text: { en: 'Gave in charity', gu: 'દાન કર્યું', hi: 'दान किया' },
  },
  {
    re: /(fed |feed|dog|cow|bird|animal|ant |sparrow|jeevdaya|ગાય|કૂતરા|કુતરા|પક્ષી|ચકલી|કીડી|ચણ|જીવદયા|गाय|कुत्ते|कुत्ता|पक्षी|चिड़िया|चींटी|जीवदया)/i,
    type: 'punya', category: 'jeev_daya', weight: 9, basis: 'go_jeev_seva',
    text: { en: 'Showed compassion to a living being', gu: 'જીવો પ્રત્યે દયા દાખવી', hi: 'जीवों के प्रति दया दिखाई' },
  },
  {
    re: /(parents|mother|father|family|wife|husband|kids|children|brother|sister|grand(mother|father)|mom|dad|માતા|પિતા|પરિવાર|મમ્મી|પપ્પા|બાળકો|પત્ની|પતિ|ભાઈ|બહેન|દાદા|દાદી|माता|पिता|परिवार|मम्मी|पापा|बच्चों|पत्नी|पति|भाई|बहन|दादा|दादी)/i,
    type: 'punya', category: 'family_duty', weight: 20, basis: 'matri_pitri_seva',
    text: { en: 'Gave time and care to family', gu: 'પરિવારને સમય અને કાળજી આપી', hi: 'परिवार को समय और देखभाल दी' },
  },
  {
    re: /(pray|prayer|temple|meditat|puja|bhajan|mantra|grateful|thankful|god|પૂજા|પ્રાર્થના|ભજન|મંદિર|ધ્યાન|માળા|આભાર|ભગવાન|પાઠ|पूजा|प्रार्थना|भजन|मंदिर|ध्यान|माला|आभार|भगवान|पाठ)/i,
    type: 'punya', category: 'gratitude_bhakti', weight: 7, basis: 'bhakti_sadhana',
    text: { en: 'Prayer or gratitude practice', gu: 'પૂજા, પ્રાર્થના કે કૃતજ્ઞતા', hi: 'पूजा, प्रार्थना या कृतज्ञता' },
  },
  {
    re: /(exercise|yoga|walk(ed)?|gym|slept early|woke up early|fast(ed|ing)|વ્યાયામ|કસરત|યોગ|ચાલવા|વહેલા ઉઠ|ઉપવાસ|उपवास|योग|व्यायाम|कसरत|टहल|जल्दी उठ)/i,
    type: 'punya', category: 'discipline_health', weight: 6, basis: 'dama_shaucha',
    text: { en: 'Cared for health and discipline', gu: 'આરોગ્ય અને શિસ્તની કાળજી લીધી', hi: 'स्वास्थ्य और अनुशासन का ध्यान रखा' },
  },
  {
    re: /(stayed calm|remained calm|patien|forgave|forgive|apolog|ધીરજ|શાંત|ક્ષમા|માફ|क्षमा|माफ|धैर्य|शांत)/i,
    type: 'punya', category: 'krodh', weight: 15, basis: 'kshama',
    text: { en: 'Stayed patient and calm', gu: 'ધીરજ અને શાંતિ રાખી', hi: 'धैर्य और शांति रखी' },
  },
  {
    re: /(honest|told the truth|spoke the truth|returned (the )?(money|wallet)|સાચું|પ્રામાણિક|ઈમાનદાર|ઇમાનદાર|ईमानदार|सच बोला|सच कहा)/i,
    type: 'punya', category: 'satya', weight: 18, basis: 'satya',
    text: { en: 'Spoke or acted truthfully', gu: 'સત્ય બોલ્યા કે સત્યથી વર્ત્યા', hi: 'सच बोला या सच्चाई से व्यवहार किया' },
  },
  {
    re: /(kind words|spoke kindly|complimented|comforted|appreciat|મીઠું બોલ|પ્રશંસા|આશ્વાસન|મીઠા શબ્દ|मीठा बोला|प्रशंसा|सांत्वना|मीठे शब्द)/i,
    type: 'punya', category: 'vani', weight: 5, basis: 'satya',
    text: { en: 'Spoke kindly', gu: 'મીઠી વાણી બોલ્યા', hi: 'मीठी वाणी बोली' },
  },
  {
    re: /(worked hard|hard work|did my job|finished (my )?work|studied|મહેનત|કામ પૂરું|અભ્યાસ|मेहनत|काम पूरा|पढ़ाई)/i,
    type: 'punya', category: 'honesty_work', weight: 10, basis: 'svadharma',
    text: { en: 'Worked or studied diligently', gu: 'મહેનતથી કામ કે અભ્યાસ કર્યો', hi: 'मेहनत से काम या पढ़ाई की' },
  },
  {
    re: /(vegetarian|no onion|no garlic|chovihar|jamikand|શાકાહારી|ચોવિહાર|જમીનકંદ|રાત્રિભોજન|शाकाहारी|चौविहार|जमीकंद)/i,
    type: 'punya', category: 'ahimsa_food', weight: 8, basis: 'ahimsa',
    text: { en: 'Kept non-violent food discipline', gu: 'અહિંસક આહારનું પાલન કર્યું', hi: 'अहिंसक आहार का पालन किया' },
  },

  {
    re: /(angry|anger|shout(ed)?|yell(ed)?|snapped|fought|fight|lost (my )?temper|ગુસ્સ|ક્રોધ|ઝઘડ|બૂમ|ચીસ|ખીજ|ગુસ્સો|गुस्सा|क्रोध|झगड़|चिल्ला|चीख)/i,
    type: 'paap', category: 'krodh', weight: 14, basis: 'krodha',
    text: { en: 'Acted out of anger', gu: 'ગુસ્સામાં વર્ત્યા', hi: 'गुस्से में व्यवहार किया' },
  },
  {
    re: /(lied|lie to|cheated|cheat|stole|stealing|bribe|જૂઠ|ખોટું બોલ|છેતર|ચોરી|લાંચ|झूठ|धोखा|चोरी|रिश्वत)/i,
    type: 'paap', category: 'satya', weight: 16, basis: 'asatya',
    text: { en: 'Was untruthful or dishonest', gu: 'અસત્ય કે અપ્રામાણિકતા કરી', hi: 'असत्य या बेईमानी की' },
  },
  {
    re: /(gossip|insult|abus(ed|ive)|rude|mock(ed)?|backbit|ગાળ|નિંદા|અપશબ્દ|ચુગલી|મજાક ઉડાવ|गाली|निंदा|अपशब्द|चुगली|मज़ाक उड़ा)/i,
    type: 'paap', category: 'vani', weight: 9, basis: 'parusha_vani',
    text: { en: 'Spoke harshly', gu: 'કઠોર વાણી બોલ્યા', hi: 'कठोर वाणी बोली' },
  },
  {
    re: /(ignored|refused to help|did not help|didn't help|skipped work|lazy|laziness|procrastinat|ના પાડી|મદદ ન કરી|આળસ|आलस|मदद नहीं की)/i,
    type: 'paap', category: 'seva', weight: 7, basis: 'seva_upeksha',
    text: { en: 'Missed a chance to help', gu: 'મદદ કરવાની તક ચૂક્યા', hi: 'मदद का अवसर चूक गए' },
  },
  {
    re: /(wasted (the )?(day|time)|too much (phone|tv|mobile)|addict|smok(ed|ing)|cigarette|alcohol|drank|tobacco|સમય બગાડ|મોબાઇલ|ટીવી|વ્યસન|સિગારેટ|દારૂ|તમાકુ|मोबाइल|टीवी|व्यसन|सिगरेट|शराब|तंबाकू)/i,
    type: 'paap', category: 'discipline_health', weight: 6, basis: 'pramada_vyasana',
    text: { en: 'Lacked self-discipline', gu: 'સ્વ-શિસ્તમાં ઉણપ રહી', hi: 'आत्म-अनुशासन में कमी रही' },
  },
  {
    re: /(ate meat|non[- ]?veg|killed|egg|માંસ|ઈંડા|ઇંડા|જીવ માર્યો|मांस|अंडा|जीव मारा)/i,
    type: 'paap', category: 'ahimsa_food', weight: 22, basis: 'himsa',
    text: { en: 'Caused harm to living beings', gu: 'જીવોને હાનિ પહોંચાડી', hi: 'जीवों को हानि पहुँचाई' },
  },
];

const REASON: Record<KarmaType, Record<Lang, string>> = {
  punya: { en: 'A deliberate, positive act.', gu: 'એક સભાન, સારું કાર્ય.', hi: 'एक सोचा-समझा, अच्छा कर्म।' },
  paap: {
    en: 'A growth area: notice it without judgement.',
    gu: 'વિકાસનું ક્ષેત્ર: કોઈ ચુકાદા વિના તેને ઓળખો.',
    hi: 'विकास का क्षेत्र: बिना निर्णय के इसे पहचानें।',
  },
  neutral: { en: '', gu: '', hi: '' },
};

const SUGGEST = {
  paap: {
    en: 'Tomorrow, pause for three breaths before responding when you feel tense.',
    gu: 'આવતીકાલે તણાવ લાગે ત્યારે જવાબ આપતાં પહેલાં ત્રણ શ્વાસ લો.',
    hi: 'कल तनाव लगे तो जवाब देने से पहले तीन साँसें लें।',
  },
  punya: {
    en: 'Tomorrow, repeat one small act of kindness quietly.',
    gu: 'આવતીકાલે એક નાનું દયાનું કાર્ય શાંતિથી ફરી કરો.',
    hi: 'कल एक छोटा दया का कर्म चुपचाप फिर करें।',
  },
} satisfies Record<'paap' | 'punya', Record<Lang, string>>;

const SAFETY_RE = /(suicide|kill myself|end my life|self[- ]harm|hurt myself|want to die|આત્મહત્યા|મરી જવું|आत्महत्या|मर जाना)/i;

export function mockAnalyze(transcript: string, profile: Pick<Profile, 'tradition' | 'language'>, seed: string): AnalysisResult {
  if (SAFETY_RE.test(transcript)) {
    return { actions: [], reflection: { teaching_id: '', suggestion: '' }, safety_flag: true };
  }
  const lang = profile.language;
  const actions = RULES.filter((r) => r.re.test(transcript)).map((r) => ({
    summary: r.text[lang],
    type: r.type,
    category: r.category,
    weight: r.weight,
    basis: r.basis,
    reason: REASON[r.type][lang],
    intention_note: '',
  }));
  const cats = actions.map((a) => a.category);
  const teaching = pickTeaching(cats, profile.tradition, seed);
  const hasPaap = actions.some((a) => a.type === 'paap');
  return {
    actions,
    reflection: { teaching_id: teaching.id, suggestion: SUGGEST[hasPaap ? 'paap' : 'punya'][lang] },
    safety_flag: false,
  };
}
