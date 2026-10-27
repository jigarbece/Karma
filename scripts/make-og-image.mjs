/**
 * Renders the 1200x630 link-preview image (public/og-image.png) from the landing hero of a running dev server.
 *
 *   npm run dev            (in another terminal; note the port)
 *   node scripts/make-og-image.mjs http://localhost:5173
 *
 * The image is committed, so this only needs re-running when the hero design changes.
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.addInitScript(() => localStorage.setItem('karma.lang', 'en'));
await page.goto(`${base}/welcome`);
await page.waitForSelector('section.panel-night');

await page.evaluate(() => {
  const hero = document.querySelector('section.panel-night');
  Object.assign(hero.style, {
    position: 'fixed', left: '0', top: '0', zIndex: '9999', width: '1200px', height: '630px', margin: '0',
    borderRadius: '0', display: 'grid', alignItems: 'center', padding: '0 64px', boxSizing: 'border-box',
  });
  hero.querySelector('div.mt-7')?.remove(); // sign-in buttons make no sense in a picture
  const paragraph = hero.querySelector('p.text-lg');
  if (paragraph) paragraph.style.maxWidth = '470px';
  const tag = document.createElement('div');
  tag.textContent = 'karma.jigarpandya.info';
  Object.assign(tag.style, { position: 'absolute', left: '64px', bottom: '34px', color: '#FFD98A', font: '600 22px "Hind Vadodara", sans-serif', letterSpacing: '0.04em' });
  hero.appendChild(tag);
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'public/og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('wrote public/og-image.png (1200x630)');
