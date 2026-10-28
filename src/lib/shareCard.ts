/**
 * Share cards drawn in the browser (no server, nothing uploaded): a 1080x1920 portrait PNG that fits a WhatsApp status.
 * Cards carry punya points, streaks and the shloka only: never paap, acts or anything the user wrote.
 */
export interface CardSpec {
  kicker: string;
  title?: string;
  /** a big number such as "+120"; leave out for a text-only card (the shloka) */
  big?: string;
  bigLabel?: string;
  /** 0..1: how full the golden ghada drawn on the card is */
  fill?: number;
  /** the main body: verse lines, or short facts */
  lines: string[];
  note?: string;
  footer: string;
  /** font stack for the verse and text; Gujarati and Devanagari need their own */
  font: string;
}

const W = 1080;
const H = 1920;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

/** A small golden ghada, filled to `fill`. Simple shapes so it draws the same everywhere. */
function drawGhada(ctx: CanvasRenderingContext2D, cx: number, top: number, size: number, fill: number) {
  const w = size;
  const h = size * 1.05;
  const bodyTop = top + h * 0.22;
  ctx.save();
  // glow
  const glow = ctx.createRadialGradient(cx, top + h * 0.6, 20, cx, top + h * 0.6, w);
  glow.addColorStop(0, 'rgba(255,200,90,0.45)');
  glow.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - w, top - 40, w * 2, h + 120);
  // body path
  const body = new Path2D();
  body.ellipse(cx, bodyTop + (h * 0.78) / 2, w / 2, (h * 0.78) / 2, 0, 0, Math.PI * 2);
  // liquid, clipped to the body
  ctx.save();
  ctx.clip(body);
  const bottom = bodyTop + h * 0.78;
  const level = bottom - Math.max(0, Math.min(1, fill)) * (h * 0.72);
  const liquid = ctx.createLinearGradient(0, level, 0, bottom);
  liquid.addColorStop(0, '#FFE08A');
  liquid.addColorStop(1, '#C98A12');
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(cx - w / 2, bodyTop, w, h * 0.78);
  ctx.fillStyle = liquid;
  ctx.fillRect(cx - w / 2, level, w, bottom - level);
  ctx.restore();
  // rim and neck
  const metal = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  metal.addColorStop(0, '#8A5A0B');
  metal.addColorStop(0.35, '#FFE08A');
  metal.addColorStop(0.7, '#C98A12');
  metal.addColorStop(1, '#6E4608');
  ctx.lineWidth = 16;
  ctx.strokeStyle = metal;
  ctx.stroke(body);
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, bodyTop + 6);
  ctx.lineTo(cx - w * 0.17, top + 20);
  ctx.lineTo(cx + w * 0.17, top + 20);
  ctx.lineTo(cx + w * 0.22, bodyTop + 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, top + 20, w * 0.26, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2A1A08';
  ctx.beginPath();
  ctx.ellipse(cx, top + 20, w * 0.19, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export async function renderShareCard(spec: CardSpec): Promise<Blob> {
  // make sure the Gujarati / Devanagari fonts are ready before drawing
  try {
    await document.fonts?.load(`700 48px ${spec.font}`, spec.lines.join(' ') + spec.kicker);
  } catch {
    /* draw with whatever is available */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2A2468');
  bg.addColorStop(1, '#0F0D2A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // soft stars
  ctx.fillStyle = 'rgba(255,224,138,0.5)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 197) % W;
    const y = (i * 331) % (H * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD98A';
  ctx.font = `600 44px ${spec.font}`;
  ctx.fillText('Karma', W / 2, 140);
  ctx.fillStyle = '#F6EFE2';
  ctx.font = `700 58px ${spec.font}`;
  let y = 250;
  for (const l of wrap(ctx, spec.kicker, W - 160)) {
    ctx.fillText(l, W / 2, y);
    y += 74;
  }
  if (spec.title) {
    ctx.fillStyle = 'rgba(246,239,226,0.8)';
    ctx.font = `500 38px ${spec.font}`;
    for (const l of wrap(ctx, spec.title, W - 200)) {
      ctx.fillText(l, W / 2, y);
      y += 52;
    }
  }

  y += 30;
  if (spec.big !== undefined) {
    drawGhada(ctx, W / 2, y, 420, spec.fill ?? 0.5);
    y += 580;
    ctx.fillStyle = '#FFE08A';
    ctx.font = `800 150px ${spec.font}`;
    ctx.fillText(spec.big, W / 2, y + 40);
    y += 110;
    if (spec.bigLabel) {
      ctx.fillStyle = 'rgba(246,239,226,0.85)';
      ctx.font = `600 42px ${spec.font}`;
      ctx.fillText(spec.bigLabel, W / 2, y);
      y += 40;
    }
  }

  y += 60;
  const verse = spec.big === undefined;
  if (verse) y = Math.max(y, 520); // a verse card sits in the middle of the page, not at the top
  ctx.fillStyle = '#F6EFE2';
  ctx.font = `${verse ? 700 : 600} ${verse ? 58 : 46}px ${spec.font}`;
  for (const raw of spec.lines) {
    for (const l of wrap(ctx, raw, W - 160)) {
      ctx.fillText(l, W / 2, y);
      y += verse ? 96 : 66;
    }
    y += verse ? 6 : 14;
  }
  if (spec.note) {
    y += verse ? 50 : 30;
    if (verse) {
      ctx.strokeStyle = 'rgba(255,217,138,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 120, y - 20);
      ctx.lineTo(W / 2 + 120, y - 20);
      ctx.stroke();
      y += 40;
    }
    ctx.fillStyle = 'rgba(246,239,226,0.85)';
    ctx.font = `500 ${verse ? 44 : 40}px ${spec.font}`;
    for (const l of wrap(ctx, spec.note, W - 180)) {
      ctx.fillText(l, W / 2, y);
      y += 62;
    }
  }

  ctx.fillStyle = '#FFD98A';
  ctx.font = `600 40px ${spec.font}`;
  ctx.fillText(spec.footer, W / 2, H - 110);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png_failed'))), 'image/png'));
}

export interface ShlokaShareSpec {
  kicker: string;
  title: string;
  lines: string[];
  meaning: string;
  hindiMeaning?: string;
  meaningLabel: string;
  hindiMeaningLabel: string;
  footer: string;
  font: string;
}

/** Draw a sunrise, lotus, and open scripture as part of the exported shloka image. */
function drawShlokaArtwork(ctx: CanvasRenderingContext2D) {
  const sunX = W / 2;
  const sunY = 407;
  const aura = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 270);
  aura.addColorStop(0, 'rgba(255,217,138,0.28)');
  aura.addColorStop(1, 'rgba(255,217,138,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(250, 150, 580, 560);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,217,138,0.54)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 142, sunY + Math.sin(a) * 142);
    ctx.lineTo(sunX + Math.cos(a) * 167, sunY + Math.sin(a) * 167);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(sunX, sunY, 124, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sunX, sunY, 103, 0, Math.PI * 2);
  ctx.stroke();

  // Eight lotus petals inside the sun.
  ctx.fillStyle = 'rgba(255,217,138,0.17)';
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(-22, -42, -20, -82, 0, -97);
    ctx.bezierCurveTo(20, -82, 22, -42, 0, -18);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#E9BD70';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
  ctx.fill();

  // An open book below the emblem, with fine page lines.
  ctx.strokeStyle = '#F5DCAA';
  ctx.fillStyle = '#E9D4AB';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(318, 565);
  ctx.quadraticCurveTo(424, 525, 540, 579);
  ctx.quadraticCurveTo(656, 525, 762, 565);
  ctx.lineTo(762, 626);
  ctx.quadraticCurveTo(650, 591, 540, 641);
  ctx.quadraticCurveTo(430, 591, 318, 626);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#AA7F49';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 579);
  ctx.lineTo(540, 641);
  ctx.stroke();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const yy = 578 + i * 15;
      ctx.beginPath();
      ctx.moveTo(540 + side * 20, yy);
      ctx.quadraticCurveTo(540 + side * 105, yy - 24, 540 + side * 188, yy - 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFittedText(
  ctx: CanvasRenderingContext2D, text: string, font: string, weight: number,
  startY: number, bottomY: number, preferredSize: number, minSize: number,
  maxWidth: number, color: string,
): number {
  let size = preferredSize;
  let lines: string[] = [];
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${font}`;
    lines = text.split('\n').flatMap((part) => wrap(ctx, part, maxWidth));
    if (startY + (lines.length - 1) * size * 1.46 <= bottomY) break;
    size -= 2;
  }
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * size * 1.46));
  return startY + lines.length * size * 1.46;
}

/** Portrait share image for a shloka, with its verse, meaning, Hindi meaning, and devotional artwork. */
export async function renderShlokaShareCard(spec: ShlokaShareSpec): Promise<Blob> {
  try {
    await Promise.all([
      document.fonts?.load(`700 54px ${spec.font}`, spec.lines.join(' ') + spec.meaning),
      document.fonts?.load('600 38px "Noto Sans Devanagari"', spec.hindiMeaning ?? ''),
    ]);
  } catch {
    /* draw with available fonts */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#171B37');
  bg.addColorStop(0.55, '#28264D');
  bg.addColorStop(1, '#10152C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(242,210,157,0.42)';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, W - 84, H - 84);
  ctx.strokeStyle = 'rgba(242,210,157,0.17)';
  ctx.strokeRect(58, 58, W - 116, H - 116);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F4DBA9';
  ctx.font = '700 46px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Karma', W / 2, 122);
  ctx.font = `600 35px ${spec.font}`;
  ctx.fillText(spec.kicker, W / 2, 186);
  ctx.fillStyle = '#E7D6B9';
  ctx.font = `500 32px ${spec.font}`;
  ctx.fillText(spec.title, W / 2, 242);

  drawShlokaArtwork(ctx);
  drawFittedText(ctx, spec.lines.join('\n'), spec.font, 700, 760, 1110, 54, 42, W - 170, '#FFF6E7');

  ctx.strokeStyle = 'rgba(242,210,157,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(370, 1154);
  ctx.lineTo(710, 1154);
  ctx.stroke();
  ctx.fillStyle = '#F4DBA9';
  ctx.font = `600 30px ${spec.font}`;
  ctx.fillText(spec.meaningLabel, W / 2, 1208);
  drawFittedText(ctx, spec.meaning, spec.font, 500, 1272, spec.hindiMeaning ? 1470 : 1690, 42, 32, W - 200, '#F5EBDD');

  if (spec.hindiMeaning) {
    ctx.fillStyle = '#F4DBA9';
    ctx.font = '600 30px "Noto Sans Devanagari", sans-serif';
    ctx.fillText(spec.hindiMeaningLabel, W / 2, 1535);
    drawFittedText(ctx, spec.hindiMeaning, '"Noto Sans Devanagari", sans-serif', 500, 1595, 1780, 38, 30, W - 210, '#F5EBDD');
  }

  ctx.fillStyle = '#DABF8F';
  ctx.font = '500 31px "Hind Vadodara", sans-serif';
  ctx.fillText(spec.footer, W / 2, H - 100);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png_failed'))), 'image/png'));
}

/** Opens the phone's share sheet with the image; otherwise downloads it. */
export async function shareImage(blob: Blob, filename: string, text: string, url: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text, url });
      return 'shared';
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    }
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
  return 'downloaded';
}

/** Share a plain invite (WhatsApp and other apps through the share sheet; otherwise copy the link). */
export async function shareInvite(text: string, url: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (navigator.share) {
    try {
      await navigator.share({ text, url });
      return 'shared';
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
  } catch {
    /* nothing more we can do */
  }
  return 'copied';
}

export const SITE_URL = 'https://karma.jigarpandya.info';
