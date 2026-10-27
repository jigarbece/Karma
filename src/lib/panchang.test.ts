import { formatTithi, tithiAt, toGujaratiDigits } from './panchang';
import { nakshatraOf, panchangFor, rashiOf, weekdayOf } from './astro';

describe('astro: nakshatra, rashi, vara', () => {
  it('maps sidereal longitudes to nakshatra, pada and rashi', () => {
    expect(nakshatraOf(0)).toEqual({ index: 0, pada: 1 }); // Ashwini pada 1
    expect(nakshatraOf(13.4)).toEqual({ index: 1, pada: 1 }); // Bharani
    expect(nakshatraOf(359.9).index).toBe(26); // Revati
    expect(rashiOf(0)).toBe(0); // Mesha
    expect(rashiOf(359)).toBe(11); // Meena
  });
  it('knows the weekday of a calendar date', () => {
    expect(weekdayOf('2026-10-26')).toBe(1); // Monday
    expect(weekdayOf('2026-10-25')).toBe(0); // Sunday
  });
  // Sharad Purnima 2026: the full moon is opposite the Sun (about 9 deg Mesha), which is Ashwini
  it('puts the Sharad Purnima 2026 sunrise moon in Ashwini, Mesha rashi, on a Monday', () => {
    const p = panchangFor(new Date('2026-10-26T05:00:00Z'), '2026-10-26', 'en');
    expect(p.nakshatra).toBe('Ashwini');
    expect(p.rashi).toBe('Mesha');
    expect(p.vara).toBe('Somvar');
    expect(p.graha).toBe('Chandra');
    expect(p.tithi).toBe('Aaso Sud 15');
  });
  it('localises the names', () => {
    const p = panchangFor(new Date('2026-10-26T05:00:00Z'), '2026-10-26', 'gu');
    expect(p.nakshatra).toBe('અશ્વિની');
    expect(p.vara).toBe('સોમવાર');
  });
});

describe('panchang', () => {
  it('converts digits to Gujarati numerals', () => {
    expect(toGujaratiDigits(15)).toBe('૧૫');
  });

  // Sharad Purnima 2026 (Aaso Sud 15) falls on 26 Oct 2026 in Gujarat
  it('computes Aaso Sud 15 for the full moon of 26 Oct 2026', () => {
    const t = tithiAt(new Date('2026-10-26T01:00:00Z')); // ~06:30 IST
    expect(formatTithi(t, 'gu')).toBe('આસો સુદ ૧૫');
  });

  // Diwali 2026 (Aaso Vad Amas) is 8 Nov 2026
  it('computes a Vad tithi after the full moon', () => {
    const t = tithiAt(new Date('2026-11-04T01:00:00Z'));
    expect(t.paksha).toBe('vad');
  });

  // Gudi Padwa / Chaitra Sud 1 2026 is 19 Mar 2026
  it('starts Chaitra after the Meena new moon', () => {
    const t = tithiAt(new Date('2026-03-20T01:00:00Z'));
    expect(formatTithi(t, 'en')).toMatch(/^Chaitra Sud/);
  });

  it('formats Hindi and English', () => {
    const t = tithiAt(new Date('2026-10-26T01:00:00Z'));
    expect(formatTithi(t, 'hi')).toBe('आश्विन शुक्ल १५');
    expect(formatTithi(t, 'en')).toBe('Aaso Sud 15');
  });
});
