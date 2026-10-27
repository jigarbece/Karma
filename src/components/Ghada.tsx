import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Pot silhouette (belly centred at 100,150). */
const POT =
  'M72 40 C72 54 66 62 56 72 C30 94 20 128 26 162 C32 202 60 224 100 224 C140 224 168 202 174 162 C180 128 170 94 144 72 C134 62 128 54 128 40 Z';
const WIN_CX = 100;
const WIN_CY = 152;
const WIN_R = 38;

interface Props {
  kind: 'punya' | 'paap';
  /** 0..1 */
  fraction: number;
  label: string;
  className?: string;
  /** show the % on the medallion */
  showPercent?: boolean;
}

/**
 * Ornate brass (Punya) or blackened (Paap) kalash. A glass medallion on the belly shows the live liquid level
 * and the glowing surface shows at the mouth. Colour is never the only signal: callers add text + numbers.
 */
export function Ghada({ kind, fraction, label, className, showPercent = true }: Props) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const punya = kind === 'punya';
  const f = Math.max(0, Math.min(1, fraction));
  const pct = Math.round(f * 100);
  const bottom = WIN_CY + WIN_R;
  const level = bottom - f * (WIN_R * 2);

  const body = punya
    ? ['#6B430D', '#B98022', '#F4CE70', '#FFE9A6', '#D9A441', '#9A6618', '#5E3A0A']
    : ['#0F0C26', '#262046', '#4E4783', '#6B63B0', '#383064', '#1E193E', '#0C0A20'];
  const water = punya ? ['#FFE9A0', '#F2B233', '#C98312'] : ['#8C87F5', '#4B45C8', '#221D7A'];
  const edge = punya ? '#7A4F10' : '#0A0820';
  const glow = punya ? '#FFD36B' : '#7B76F0';
  const emboss = punya ? '#FFF0B8' : '#9A94E8';

  return (
    <svg viewBox="0 0 200 250" role="img" aria-label={label} className={className}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" x2="1" y1="0" y2="0">
          {body.map((c, i) => (
            <stop key={c + i} offset={i / (body.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`w${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={water[0]} />
          <stop offset="0.5" stopColor={water[1]} />
          <stop offset="1" stopColor={water[2]} />
        </linearGradient>
        <radialGradient id={`g${id}`} cx="0.5" cy="0.62" r="0.62">
          <stop offset="0" stopColor={glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`s${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={water[0]} />
          <stop offset="1" stopColor={water[2]} />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <circle cx={WIN_CX} cy={WIN_CY} r={WIN_R - 3} />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="138" rx="96" ry="98" fill={`url(#g${id})`} />
      <ellipse cx="100" cy="240" rx="52" ry="7" fill="#000" opacity="0.2" />

      {/* foot */}
      <path d="M66 222 L74 238 H126 L134 222 Z" fill={`url(#b${id})`} stroke={edge} strokeWidth="1.5" />
      <path d="M70 232 H130" stroke={emboss} strokeOpacity="0.5" strokeWidth="1" />

      {/* body */}
      <path d={POT} fill={`url(#b${id})`} stroke={edge} strokeWidth="2" />

      {/* embossed lotus petals around the shoulder */}
      <g fill="none" stroke={emboss} strokeOpacity="0.7" strokeWidth="1.2">
        {[-60, -40, -20, 0, 20, 40, 60].map((r) => (
          <path key={r} d="M100 80 C92 92 92 104 100 112 C108 104 108 92 100 80Z" transform={`rotate(${r} 100 150)`} />
        ))}
        <path d="M44 100 C70 112 130 112 156 100" strokeDasharray="1.5 3.5" />
        <path d="M30 188 C60 206 140 206 170 188" strokeDasharray="1.5 3.5" />
      </g>

      {/* mouth: rim, inner cavity and the glowing surface */}
      <ellipse cx="100" cy="40" rx="36" ry="9.5" fill={`url(#b${id})`} stroke={edge} strokeWidth="2" />
      <ellipse cx="100" cy="40" rx="27" ry="6.2" fill={punya ? '#4A2C06' : '#08061A'} />
      {f > 0.01 && <ellipse cx="100" cy="40.5" rx="25" ry="5" fill={`url(#s${id})`} opacity={0.45 + 0.55 * f} />}

      {/* medallion: ring, cavity, liquid and percent */}
      <circle cx={WIN_CX} cy={WIN_CY} r={WIN_R} fill={`url(#b${id})`} stroke={edge} strokeWidth="2" />
      <circle cx={WIN_CX} cy={WIN_CY} r={WIN_R - 3} fill={punya ? '#3B2406' : '#07051A'} />
      <g clipPath={`url(#c${id})`}>
        <motion.g initial={false} animate={{ y: level }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 16 }}>
          <motion.path
            d="M40 0 Q50 -5 60 0 T80 0 T100 0 T120 0 T140 0 T160 0 T180 0 V80 H40Z"
            fill={`url(#w${id})`}
            animate={reduce ? undefined : { x: [0, -40] }}
            transition={reduce ? undefined : { duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.g>
      </g>
      <path d={`M${WIN_CX - 28} ${WIN_CY - 14} A32 32 0 0 1 ${WIN_CX - 8} ${WIN_CY - 30}`} stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
      {showPercent && (
        <text
          x={WIN_CX} y={WIN_CY + 8} textAnchor="middle" fontSize="24" fontWeight="700" fill="#fff"
          fontFamily="'Cormorant Garamond','Tiro Gujarati',Georgia,serif" stroke="#000" strokeOpacity="0.55" strokeWidth="3" paintOrder="stroke"
        >
          {pct}%
        </text>
      )}

      {/* specular highlight */}
      <path d="M38 96 C30 116 30 138 36 158" stroke="#fff" strokeOpacity="0.32" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
