import type { Lang } from '../lib/types';
import { getTeaching } from '../lib/teachings';

export interface Shloka {
  id: string;
  ref: string;
  /** Devanagari, two lines */
  sa: string;
  /** Roman transliteration, two lines */
  roman: string;
  /** reuse the curated teaching text when set; otherwise `meaning` */
  teachingId?: string;
  meaning?: Record<Lang, string>;
}

/**
 * Bhagavad Gita verses for the daily shloka. Sanskrit is the traditional text; meanings are short paraphrases.
 * Have a scholar proof-read before public launch.
 */
export const SHLOKAS: Shloka[] = [
  {
    id: 'gita-2-47', ref: 'Bhagavad Gita 2.47', teachingId: 'gita-2-47',
    sa: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    roman: 'karmaṇy-evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi',
  },
  {
    id: 'gita-6-5', ref: 'Bhagavad Gita 6.5', teachingId: 'gita-6-5',
    sa: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    roman: 'uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
  },
  {
    id: 'gita-9-27', ref: 'Bhagavad Gita 9.27', teachingId: 'gita-9-27',
    sa: 'यत्करोषि यदश्नासि यज्जुहोषि ददासि यत् ।\nयत्तपस्यसि कौन्तेय तत्कुरुष्व मदर्पणम् ॥',
    roman: 'yat karoṣi yad aśnāsi yaj juhoṣi dadāsi yat\nyat tapasyasi kaunteya tat kuruṣva mad-arpaṇam',
  },
  {
    id: 'gita-17-15', ref: 'Bhagavad Gita 17.15', teachingId: 'gita-17-15',
    sa: 'अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत् ।\nस्वाध्यायाभ्यसनं चैव वाङ्मयं तप उच्यते ॥',
    roman: 'anudvega-karaṁ vākyaṁ satyaṁ priya-hitaṁ ca yat\nsvādhyāyābhyasanaṁ caiva vāṅ-mayaṁ tapa ucyate',
  },
  {
    id: 'gita-16-21', ref: 'Bhagavad Gita 16.21', teachingId: 'gita-16-21',
    sa: 'त्रिविधं नरकस्येदं द्वारं नाशनमात्मनः ।\nकामः क्रोधस्तथा लोभस्तस्मादेतत्त्रयं त्यजेत् ॥',
    roman: 'tri-vidhaṁ narakasyedaṁ dvāraṁ nāśanam ātmanaḥ\nkāmaḥ krodhas tathā lobhas tasmād etat trayaṁ tyajet',
  },
  {
    id: 'gita-12-13', ref: 'Bhagavad Gita 12.13', teachingId: 'gita-12-13',
    sa: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च ।\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी ॥',
    roman: 'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī',
  },
  {
    id: 'gita-4-7', ref: 'Bhagavad Gita 4.7',
    sa: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
    roman: 'yadā yadā hi dharmasya glānir bhavati bhārata\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham',
    meaning: {
      en: 'Whenever dharma declines and adharma rises, the Divine takes form to restore balance.',
      hi: 'जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब ईश्वर संतुलन लौटाने के लिए प्रकट होते हैं।',
      gu: 'જ્યારે જ્યારે ધર્મની હાનિ અને અધર્મની વૃદ્ધિ થાય છે, ત્યારે ત્યારે ઈશ્વર સંતુલન પાછું લાવવા પ્રગટ થાય છે.',
    },
  },
  {
    id: 'gita-18-66', ref: 'Bhagavad Gita 18.66',
    sa: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥',
    roman: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ',
    meaning: {
      en: 'Let go of every burden and take refuge in the Divine alone. Do not grieve; you will be freed from all wrong.',
      hi: 'सब बोझ छोड़कर केवल ईश्वर की शरण लो। शोक मत करो; तुम सब पापों से मुक्त होगे।',
      gu: 'બધા બોજ છોડીને ફક્ત ઈશ્વરનું શરણ લો. શોક ન કરો; તમે બધા પાપોથી મુક્ત થશો.',
    },
  },
];

/**
 * Devanagari and Gujarati share one Unicode layout (the Gujarati block is the Devanagari block plus 0x180), so a
 * Sanskrit verse can be shown in Gujarati script by shifting each letter. The danda marks are shared.
 */
export function devanagariToGujarati(text: string): string {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    out += cp >= 0x0901 && cp <= 0x097f && cp !== 0x0964 && cp !== 0x0965 ? String.fromCodePoint(cp + 0x180) : ch;
  }
  return out;
}

/** The verse in the reader's script: Gujarati script for Gujarati, Devanagari otherwise. */
export function shlokaVerse(s: Shloka, lang: Lang): string {
  return lang === 'gu' ? devanagariToGujarati(s.sa) : s.sa;
}

/** One shloka per calendar day, stable for the whole day. */
export function shlokaOfTheDay(date: string): Shloka {
  let h = 0;
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SHLOKAS[h % SHLOKAS.length];
}

export function shlokaMeaning(s: Shloka, lang: Lang): string {
  return (s.teachingId ? getTeaching(s.teachingId)?.text[lang] : undefined) ?? s.meaning?.[lang] ?? s.meaning?.en ?? '';
}
