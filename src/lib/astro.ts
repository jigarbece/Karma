import * as Astronomy from 'astronomy-engine';
import { AHMEDABAD, formatTithi, lahiriAyanamsa, sunriseBefore, tithiAt, type Tithi } from './panchang';
import type { Lang } from './types';

/** Sidereal (Lahiri) longitude of the Moon in degrees, 0..360. */
export function siderealMoonLongitude(at: Date): number {
  const lon = Astronomy.EclipticGeoMoon(at).lon - lahiriAyanamsa(at);
  return ((lon % 360) + 360) % 360;
}

const NAKSHATRA: Record<Lang, string[]> = {
  en: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
  gu: ['અશ્વિની', 'ભરણી', 'કૃત્તિકા', 'રોહિણી', 'મૃગશીર્ષ', 'આર્દ્રા', 'પુનર્વસુ', 'પુષ્ય', 'આશ્લેષા', 'મઘા', 'પૂર્વા ફાલ્ગુની', 'ઉત્તરા ફાલ્ગુની', 'હસ્ત', 'ચિત્રા', 'સ્વાતિ', 'વિશાખા', 'અનુરાધા', 'જ્યેષ્ઠા', 'મૂળ', 'પૂર્વાષાઢા', 'ઉત્તરાષાઢા', 'શ્રવણ', 'ધનિષ્ઠા', 'શતભિષા', 'પૂર્વા ભાદ્રપદ', 'ઉત્તરા ભાદ્રપદ', 'રેવતી'],
  hi: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'],
};

const RASHI: Record<Lang, string[]> = {
  en: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
  gu: ['મેષ', 'વૃષભ', 'મિથુન', 'કર્ક', 'સિંહ', 'કન્યા', 'તુલા', 'વૃશ્ચિક', 'ધનુ', 'મકર', 'કુંભ', 'મીન'],
  hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'],
};

const VARA: Record<Lang, string[]> = {
  en: ['Ravivar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar'],
  gu: ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
};

const GRAHA: Record<Lang, string[]> = {
  en: ['Surya', 'Chandra', 'Mangal', 'Budh', 'Guru', 'Shukra', 'Shani'],
  gu: ['સૂર્ય', 'ચંદ્ર', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
  hi: ['सूर्य', 'चंद्र', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
};

/** 0..26 and pada 1..4 for a sidereal longitude. */
export function nakshatraOf(siderealLon: number) {
  const span = 360 / 27;
  const index = Math.floor(siderealLon / span) % 27;
  const pada = Math.floor((siderealLon % span) / (span / 4)) + 1;
  return { index, pada };
}

export const rashiOf = (siderealLon: number): number => Math.floor(siderealLon / 30) % 12;

/** Weekday index 0 = Sunday for a YYYY-MM-DD calendar date. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export interface PanchangDay {
  vara: string;
  graha: string;
  varaIndex: number;
  tithi: string;
  tithiRaw: Tithi;
  nakshatra: string;
  pada: number;
  rashi: string;
}

/**
 * The day's panchang elements, taken at local sunrise for Ahmedabad (Lahiri ayanamsa).
 * Traditional almanac values for guidance; not a substitute for a printed panchang.
 */
export function panchangFor(now: Date, today: string, lang: Lang, loc = AHMEDABAD): PanchangDay {
  const instant = sunriseBefore(now, loc);
  const tithiRaw = tithiAt(instant);
  const moon = siderealMoonLongitude(instant);
  const { index, pada } = nakshatraOf(moon);
  const v = weekdayOf(today);
  return {
    vara: VARA[lang][v],
    graha: GRAHA[lang][v],
    varaIndex: v,
    tithi: formatTithi(tithiRaw, lang),
    tithiRaw,
    nakshatra: NAKSHATRA[lang][index],
    pada,
    rashi: RASHI[lang][rashiOf(moon)],
  };
}
