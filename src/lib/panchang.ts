import * as Astronomy from 'astronomy-engine';

/** Gujarati amanta months, Chaitra first. */
export const GUJARATI_MONTHS = [
  'ચૈત્ર',
  'વૈશાખ',
  'જેઠ',
  'અષાઢ',
  'શ્રાવણ',
  'ભાદરવો',
  'આસો',
  'કારતક',
  'માગશર',
  'પોષ',
  'મહા',
  'ફાગણ',
];
export const HINDI_MONTHS = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
export const EN_MONTHS = ['Chaitra', 'Vaishakh', 'Jeth', 'Ashadh', 'Shravan', 'Bhadarvo', 'Aaso', 'Kartak', 'Magshar', 'Posh', 'Maha', 'Fagan'];

// Default location: Ahmedabad
export const AHMEDABAD = { lat: 23.0225, lon: 72.5714, height: 53 };

/** Lahiri (Chitrapaksha) ayanamsa in degrees, linear approximation good to ~0.01 deg for 1950-2100. */
export function lahiriAyanamsa(date: Date): number {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.2425 * 86400000);
  return 23.857 + 0.013972 * years;
}

export function siderealSunLongitude(date: Date): number {
  const lon = Astronomy.SunPosition(date).elon - lahiriAyanamsa(date);
  return ((lon % 360) + 360) % 360;
}

export interface Tithi {
  monthIndex: number; // 0 = Chaitra
  paksha: 'sud' | 'vad';
  day: number; // 1..15
  number: number; // 1..30
}

function lastNewMoon(at: Date): Date {
  let t = Astronomy.SearchMoonPhase(0, new Date(at.getTime() - 31 * 86400000), 32);
  let last = t?.date ?? new Date(at.getTime() - 15 * 86400000);
  for (let i = 0; i < 3 && t; i++) {
    const next = Astronomy.SearchMoonPhase(0, new Date(t.date.getTime() + 86400000), 32);
    if (!next || next.date.getTime() > at.getTime()) break;
    last = next.date;
    t = next;
  }
  return last;
}

/** Instant used for the day's tithi: the latest local sunrise at/before `at`. */
export function sunriseBefore(at: Date, loc = AHMEDABAD): Date {
  const observer = new Astronomy.Observer(loc.lat, loc.lon, loc.height);
  const r = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, new Date(at.getTime() - 24 * 3600000), 2);
  if (r && r.date.getTime() <= at.getTime()) return r.date;
  // `at` is before the sunrise found in the window; look one day earlier
  const prev = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, new Date(at.getTime() - 48 * 3600000), 2);
  return prev?.date ?? at;
}

export function tithiAt(instant: Date): Tithi {
  const elong = Astronomy.MoonPhase(instant); // 0..360, moon-sun longitude difference
  const number = Math.min(30, Math.floor(elong / 12) + 1);
  const newMoon = lastNewMoon(instant);
  const sunRashi = Math.floor(siderealSunLongitude(newMoon) / 30); // 0 = Mesha
  // Chaitra begins at the new moon with the Sun in Meena (index 11)
  const monthIndex = (sunRashi + 1) % 12;
  return {
    monthIndex,
    paksha: number <= 15 ? 'sud' : 'vad',
    day: number <= 15 ? number : number - 15,
    number,
  };
}

export function tithiForNow(now = new Date(), loc = AHMEDABAD): Tithi {
  return tithiAt(sunriseBefore(now, loc));
}

export function toGujaratiDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => '૦૧૨૩૪૫૬૭૮૯'[Number(d)]);
}
export function toDevanagariDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]);
}

export function formatTithi(t: Tithi, lang: 'gu' | 'hi' | 'en'): string {
  if (lang === 'gu') {
    return `${GUJARATI_MONTHS[t.monthIndex]} ${t.paksha === 'sud' ? 'સુદ' : 'વદ'} ${toGujaratiDigits(t.day)}`;
  }
  if (lang === 'hi') {
    return `${HINDI_MONTHS[t.monthIndex]} ${t.paksha === 'sud' ? 'शुक्ल' : 'कृष्ण'} ${toDevanagariDigits(t.day)}`;
  }
  return `${EN_MONTHS[t.monthIndex]} ${t.paksha === 'sud' ? 'Sud' : 'Vad'} ${t.day}`;
}
