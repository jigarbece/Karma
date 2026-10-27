import { formatTithi, tithiAt, toGujaratiDigits } from './panchang';

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
