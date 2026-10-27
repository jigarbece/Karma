import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/*
 * Ultra-glossy brass (Punya) and blackened-steel (Paap) kalash.
 * Geometry, gradients and layering follow karma_ghada_ultra_glossy_contrast_demo.html.
 * The liquid fills from y=390 (empty) to y=138 (full).
 */
const BODY = 'M125 118 C116 143 84 160 69 193 C39 258 59 356 116 391 C160 418 260 418 304 391 C361 356 381 258 351 193 C336 160 304 143 295 118 Z';
const SHELL = 'M137 132 C126 153 101 169 88 199 C64 255 81 338 127 369 C165 395 255 395 293 369 C339 338 356 255 332 199 C319 169 294 153 283 132 Z';
const TOP = 138;
const BOTTOM = 390;

type Stop = [number, string];

interface Look {
  metal: Stop[];
  bodyGrad: Stop[];
  liquid: Stop[];
  shine: Stop[];
  glass: string;
  pattern: { stroke: string; opacity: number; width: number };
  surface: string;
  surfaceDark: { fill: string; opacity: number };
  band: { fill: string; opacity: number };
  backdrop: { fill: string; opacity: number };
  topGlow: { fill: string; opacity: number };
  shadow: { color: string; opacity: number };
  shell: { fill: string; fillOpacity: number; stroke: string; strokeOpacity: number };
  collar: { inner: string; deep: string; glint: string; glintOpacity: number };
  bands: Array<{ d: string; stroke: string; width: number; opacity: number }>;
  lotus: { stroke: string; width: number; opacity: number };
  specular: { width: number; opacity: number };
  glows: [number, number];
  bubbles: Array<[number, number, number]>;
  sparkles: Array<[number, number, number]>;
  sparkle: string;
  text: { shadow: string };
}

const BAND_PATHS = [
  'M103 156 Q210 181 317 156',
  'M100 166 Q210 192 320 166',
  'M119 347 Q210 373 301 347',
  'M126 358 Q210 380 294 358',
];

const GOLD: Look = {
  metal: [[0, '#3c1d00'], [8, '#7d4303'], [19, '#f3bd38'], [27, '#fff3a9'], [36, '#b56707'], [50, '#f8c748'], [61, '#8a4d04'], [75, '#ffe38a'], [88, '#b56d0a'], [100, '#3a1d00']],
  bodyGrad: [[0, '#fff8c9'], [14, '#ffe27e'], [34, '#c77a09'], [52, '#f7c64d'], [74, '#8b4b04'], [100, '#341700']],
  liquid: [[0, '#fffbe0'], [24, '#ffd52f'], [60, '#e58d00'], [100, '#7f3f00']],
  shine: [[0, '#fff'], [45, '#fff'], [60, '#fff'], [100, '#fff']],
  glass: '#fff',
  pattern: { stroke: '#ffe69d', opacity: 0.42, width: 1.4 },
  surface: '#fff09a',
  surfaceDark: { fill: '#9a5600', opacity: 0.3 },
  band: { fill: '#fff6b5', opacity: 0.34 },
  backdrop: { fill: '#f7ecd2', opacity: 0.34 },
  topGlow: { fill: '#fff', opacity: 0.1 },
  shadow: { color: '#3a1c00', opacity: 0.35 },
  shell: { fill: '#fff8df', fillOpacity: 0.08, stroke: '#fff6c5', strokeOpacity: 0.42 },
  collar: { inner: '#2b1500', deep: '#0d0600', glint: '#fff6c4', glintOpacity: 0.28 },
  bands: [
    { d: BAND_PATHS[0], stroke: '#ffe48f', width: 5, opacity: 0.82 },
    { d: BAND_PATHS[1], stroke: '#7a4001', width: 3, opacity: 0.86 },
    { d: BAND_PATHS[2], stroke: '#ffe799', width: 5, opacity: 0.64 },
    { d: BAND_PATHS[3], stroke: '#6f3901', width: 3, opacity: 0.78 },
  ],
  lotus: { stroke: '#ffe9a7', width: 2.4, opacity: 0.5 },
  specular: { width: 22, opacity: 0.58 },
  glows: [0.38, 0.13],
  bubbles: [[156, 272, 5], [237, 309, 4], [196, 348, 6]],
  sparkles: [[126, 212, 3.5], [274, 244, 3], [223, 281, 2.7], [171, 311, 2.4]],
  sparkle: '#fff9c8',
  text: { shadow: 'drop-shadow(0 3px 4px rgba(0,0,0,.38))' },
};

const DARK: Look = {
  metal: [[0, '#080914'], [10, '#242943'], [22, '#777b9f'], [34, '#2f3558'], [49, '#11152c'], [64, '#7a5d35'], [78, '#3f456b'], [90, '#1b1f39'], [100, '#060711']],
  bodyGrad: [[0, '#8a90bd'], [16, '#4a507c'], [39, '#242946'], [61, '#191d38'], [80, '#292f53'], [100, '#090b1d']],
  liquid: [[0, '#d9deff'], [22, '#6478ff'], [58, '#2637b6'], [100, '#0b1040']],
  shine: [[0, '#dfe5ff'], [48, '#eef1ff'], [65, '#dfe5ff'], [100, '#dfe5ff']],
  glass: '#e5eaff',
  pattern: { stroke: '#9f87ad', opacity: 0.36, width: 1.3 },
  surface: '#99a8ff',
  surfaceDark: { fill: '#111b78', opacity: 0.36 },
  band: { fill: '#b9c4ff', opacity: 0.26 },
  backdrop: { fill: '#d9dced', opacity: 0.18 },
  topGlow: { fill: '#dfe5ff', opacity: 0.06 },
  shadow: { color: '#050713', opacity: 0.45 },
  shell: { fill: '#c7cdfd', fillOpacity: 0.035, stroke: '#b3bdff', strokeOpacity: 0.2 },
  collar: { inner: '#03040a', deep: '#000', glint: '#d4dbff', glintOpacity: 0.12 },
  bands: [
    { d: BAND_PATHS[0], stroke: '#8f7ca8', width: 5, opacity: 0.55 },
    { d: BAND_PATHS[1], stroke: '#11142a', width: 3, opacity: 0.92 },
    { d: BAND_PATHS[2], stroke: '#725f8f', width: 5, opacity: 0.52 },
    { d: BAND_PATHS[3], stroke: '#101329', width: 3, opacity: 0.84 },
  ],
  lotus: { stroke: '#8c78a7', width: 2.3, opacity: 0.43 },
  specular: { width: 20, opacity: 0.42 },
  glows: [0.2, 0.07],
  bubbles: [[159, 339, 5], [236, 358, 4]],
  sparkles: [[130, 238, 3.3], [274, 265, 3], [222, 303, 2.6]],
  sparkle: '#d5dcff',
  text: { shadow: 'drop-shadow(0 3px 4px rgba(0,0,0,.45))' },
};

const stops = (list: Stop[], opacity?: (i: number) => number) =>
  list.map(([o, c], i) => <stop key={`${o}-${i}`} offset={`${o}%`} stopColor={c} stopOpacity={opacity ? opacity(i) : undefined} />);

interface Props {
  kind: 'punya' | 'paap';
  /** 0..1 */
  fraction: number;
  label: string;
  className?: string;
  showPercent?: boolean;
}

/** Glossy ghada with a live liquid level. Colour is never the only signal: callers add text + numbers. */
export function Ghada({ kind, fraction, label, className, showPercent = true }: Props) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const L = kind === 'punya' ? GOLD : DARK;
  const f = Math.max(0, Math.min(1, fraction));
  const pct = Math.round(f * 100);
  const y = BOTTOM - f * (BOTTOM - TOP);
  const h = BOTTOM - y;
  const ease = reduce ? { duration: 0 } : { duration: 0.95, ease: [0.2, 0.72, 0.25, 1] as [number, number, number, number] };
  const u = (name: string) => `${name}${id}`;

  const dark = kind === 'paap';
  const shineOps = dark ? [0, 0.72, 0.12, 0] : [0, 0.85, 0.18, 0];

  return (
    <svg viewBox="0 0 420 470" role="img" aria-label={label} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={u('inner')}><path d={BODY} /></clipPath>
        <linearGradient id={u('metal')} x1="0" y1="0" x2="1" y2="0">{stops(L.metal)}</linearGradient>
        <radialGradient id={u('body')} cx="32%" cy="24%" r="82%">{stops(L.bodyGrad)}</radialGradient>
        <linearGradient id={u('liquid')} x1="0" y1="0" x2="0" y2="1">{stops(L.liquid)}</linearGradient>
        <linearGradient id={u('shine')} x1="0" y1="0" x2="1" y2="0">{stops(L.shine, (i) => shineOps[i])}</linearGradient>
        <radialGradient id={u('glass')}>
          <stop offset="0%" stopColor={L.glass} stopOpacity={dark ? 0.7 : 0.9} />
          <stop offset="100%" stopColor={L.glass} stopOpacity="0" />
        </radialGradient>
        <pattern id={u('pat')} width="28" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 9 Q7 1 14 9 Q21 17 28 9" fill="none" stroke={L.pattern.stroke} strokeWidth={L.pattern.width} opacity={L.pattern.opacity} />
        </pattern>
        <filter id={u('glow')}>
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={u('shadow')}>
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor={L.shadow.color} floodOpacity={L.shadow.opacity} />
        </filter>
      </defs>

      {/* liquid inside the vessel */}
      <g clipPath={`url(#${u('inner')})`}>
        <rect x="58" y="126" width="304" height="264" fill={L.backdrop.fill} opacity={L.backdrop.opacity} />
        <motion.rect x="58" width="304" fill={`url(#${u('liquid')})`} initial={false} animate={{ y, height: h }} transition={ease} />
        <motion.ellipse className="gh-surface" cx="210" rx="142" ry="15" fill={L.surface} filter={`url(#${u('glow')})`} initial={false} animate={{ cy: y }} transition={ease} />
        <motion.ellipse cx="210" rx="136" ry="11" fill={L.surfaceDark.fill} opacity={L.surfaceDark.opacity} initial={false} animate={{ cy: y + 3 }} transition={ease} />
        <motion.rect x="64" width="292" height="34" fill={L.band.fill} opacity={L.band.opacity} initial={false} animate={{ y: y - 8 }} transition={ease} />
        <ellipse cx="210" cy="154" rx="118" ry="38" fill={L.topGlow.fill} opacity={L.topGlow.opacity} />
        {L.bubbles.map(([cx, cy, r], i) => (
          <circle key={i} className={`gh-bubble gh-b${i}`} cx={cx} cy={cy} r={r} fill="#fff" />
        ))}
      </g>

      {/* sculpted glossy body */}
      <path d={BODY} fill={`url(#${u('body')})`} fillOpacity={dark ? 0.22 : 0.16} stroke={`url(#${u('metal')})`} strokeWidth="18" filter={`url(#${u('shadow')})`} />
      {/* glassy inner shell */}
      <path d={SHELL} fill={L.shell.fill} fillOpacity={L.shell.fillOpacity} stroke={L.shell.stroke} strokeOpacity={L.shell.strokeOpacity} strokeWidth="3" />

      {/* ornamental metallic collar */}
      <path d="M125 118 L140 60 L280 60 L295 118 Z" fill={`url(#${u('metal')})`} />
      <rect x="137" y="78" width="146" height="20" fill={`url(#${u('pat')})`} opacity="0.9" />
      <ellipse cx="210" cy="62" rx="98" ry="25" fill={`url(#${u('metal')})`} />
      <ellipse cx="210" cy="61" rx="75" ry="14" fill={L.collar.inner} />
      <ellipse cx="210" cy="61" rx="62" ry="9" fill={L.collar.deep} />
      <ellipse cx="198" cy="57" rx="34" ry="5" fill={L.collar.glint} opacity={L.collar.glintOpacity} />

      {/* engraved bands */}
      {L.bands.map((b, i) => (
        <path key={i} d={b.d} fill="none" stroke={b.stroke} strokeWidth={b.width} opacity={b.opacity} />
      ))}

      {/* lotus engraving */}
      <g fill="none" stroke={L.lotus.stroke} strokeWidth={L.lotus.width} opacity={L.lotus.opacity}>
        <path d="M158 326 Q176 295 194 326 Q176 356 158 326Z" />
        <path d="M192 326 Q210 286 228 326 Q210 366 192 326Z" />
        <path d="M226 326 Q244 295 262 326 Q244 356 226 326Z" />
        <path d="M170 345 Q210 309 250 345" />
      </g>

      {/* strong specular reflection */}
      <path d="M114 162 C90 205 88 282 121 337 C136 362 149 373 160 381" fill="none" stroke={`url(#${u('shine')})`} strokeWidth={L.specular.width} strokeLinecap="round" opacity={L.specular.opacity} />
      <ellipse cx="150" cy="235" rx="44" ry="124" fill={`url(#${u('glass')})`} transform="rotate(13 150 235)" opacity={L.glows[0]} />
      <ellipse cx="283" cy="262" rx="20" ry="88" fill={`url(#${u('glass')})`} transform="rotate(-12 283 262)" opacity={L.glows[1]} />

      {/* sparkles */}
      {L.sparkles.map(([cx, cy, r], i) => (
        <circle key={i} className={`gh-twinkle gh-t${i}`} cx={cx} cy={cy} r={r} fill={L.sparkle} />
      ))}

      {showPercent && (
        <text x="210" y="267" textAnchor="middle" fontSize="44" fontWeight="900" fill="#fff" style={{ filter: L.text.shadow }}>
          {pct}%
        </text>
      )}
    </svg>
  );
}
