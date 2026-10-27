import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const meta = (attr: string, name: string) => new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1];

describe('link preview (Open Graph)', () => {
  it('has the tags LinkedIn, WhatsApp and X read', () => {
    expect(meta('property', 'og:title')).toBeTruthy();
    expect(meta('property', 'og:description')!.length).toBeGreaterThan(40);
    expect(meta('property', 'og:type')).toBe('website');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
  });

  it('uses absolute https URLs on the live domain', () => {
    for (const v of [meta('property', 'og:image'), meta('property', 'og:url'), meta('name', 'twitter:image')]) {
      expect(v).toMatch(/^https:\/\/karma\.jigarpandya\.info\//);
    }
    expect(meta('property', 'og:image')).toBe('https://karma.jigarpandya.info/og-image.png');
  });

  it('points at a real 1200x630 PNG that is under 1 MB', () => {
    const png = readFileSync('public/og-image.png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200); // IHDR width
    expect(png.readUInt32BE(20)).toBe(630); // IHDR height
    expect(png.length).toBeLessThan(1_000_000);
  });
});
