/**
 * The Gujarati and Devanagari fonts are split by script, so a browser only downloads them when that script first appears.
 * That made the first switch to Gujarati or Hindi flash and lag. This fetches them quietly once the app is idle.
 */
const SAMPLES: Array<[family: string, text: string, weights: number[]]> = [
  ['"Hind Vadodara"', 'ગુજરાતી ભાષા ૧૨૩', [400, 500, 600, 700]],
  ['"Noto Sans Devanagari"', 'हिंदी भाषा १२३', [400, 500, 600, 700]],
  ['"Noto Sans"', 'Paruṣa-vāṇī Annadāna Dama Śauca Kṣamā Bhagavad Gītā', [400, 500, 600, 700]],
  ['"Tiro Gujarati"', 'ગુજરાતી શ્લોક', [400]],
  ['"Tiro Devanagari Hindi"', 'हिंदी श्लोक', [400]],
];

export function prewarmFonts(): void {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const run = () => {
    for (const [family, text, weights] of SAMPLES) {
      for (const w of weights) document.fonts.load(`${w} 16px ${family}`, text).catch(() => undefined);
    }
  };
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (idle) idle(run);
  else setTimeout(run, 1500);
}
