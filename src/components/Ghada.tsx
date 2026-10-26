import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const POT =
  'M58 26 C58 40 50 48 40 56 C20 70 12 95 14 120 C16 152 40 176 80 176 C120 176 144 152 146 120 C148 95 140 70 120 56 C110 48 102 40 102 26 Z';
const TOP = 58; // water level when full
const BOTTOM = 170; // water level when empty

interface Props {
  kind: 'punya' | 'paap';
  /** 0..1 */
  fraction: number;
  label: string;
  className?: string;
}

/** SVG kalash with an animated liquid level. Colour is never the only signal: callers add text + numbers. */
export function Ghada({ kind, fraction, label, className }: Props) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const punya = kind === 'punya';
  const level = BOTTOM - Math.max(0, Math.min(1, fraction)) * (BOTTOM - TOP);

  const water = punya ? ['#FFE08A', '#F0A81C', '#C77F0A'] : ['#6C67E6', '#3A35A8', '#1B1763'];
  const body = punya ? ['#F1CC7B', '#C18A2C', '#7A4F10'] : ['#4A4366', '#262042', '#120F28'];

  return (
    <svg viewBox="0 0 160 200" role="img" aria-label={label} className={className}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={body[0]} />
          <stop offset="0.55" stopColor={body[1]} />
          <stop offset="1" stopColor={body[2]} />
        </linearGradient>
        <linearGradient id={`w${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={water[0]} />
          <stop offset="0.5" stopColor={water[1]} />
          <stop offset="1" stopColor={water[2]} />
        </linearGradient>
        <radialGradient id={`g${id}`} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor={punya ? '#FFD36B' : '#7B76F0'} stopOpacity="0.55" />
          <stop offset="1" stopColor={punya ? '#FFD36B' : '#7B76F0'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <path d={POT} transform="translate(80 101) scale(0.9) translate(-80 -101)" />
        </clipPath>
      </defs>

      {/* glow */}
      <ellipse cx="80" cy="115" rx="78" ry="80" fill={`url(#g${id})`} />
      {/* base shadow */}
      <ellipse cx="80" cy="186" rx="44" ry="6" fill="#000" opacity="0.18" />
      {/* pot body */}
      <path d={POT} fill={`url(#b${id})`} stroke={punya ? '#8A5A12' : '#0E0B22'} strokeWidth="2" />
      {/* inner cavity */}
      <path d={POT} transform="translate(80 101) scale(0.9) translate(-80 -101)" fill={punya ? '#5B3A0C' : '#0B0920'} opacity="0.9" />

      {/* liquid */}
      <g clipPath={`url(#c${id})`}>
        <motion.g initial={false} animate={{ y: level }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 16 }}>
          <motion.path
            d="M-80 0 Q-60 -7 -40 0 T0 0 T40 0 T80 0 T120 0 T160 0 T200 0 T240 0 V160 H-80 Z"
            fill={`url(#w${id})`}
            animate={reduce ? undefined : { x: [0, 80] }}
            transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M-80 3 Q-60 -4 -40 3 T0 3 T40 3 T80 3 T120 3 T160 3 T200 3 T240 3 V160 H-80 Z"
            fill={punya ? '#FFE9A8' : '#8A86F2'}
            opacity="0.35"
            animate={reduce ? undefined : { x: [80, 0] }}
            transition={reduce ? undefined : { duration: 4.6, repeat: Infinity, ease: 'linear' }}
          />
        </motion.g>
      </g>

      {/* rim + highlights */}
      <ellipse cx="80" cy="26" rx="24" ry="6" fill={punya ? '#E7B84F' : '#3A3358'} stroke={punya ? '#8A5A12' : '#0E0B22'} strokeWidth="2" />
      <ellipse cx="80" cy="26" rx="17" ry="3.4" fill={punya ? '#5B3A0C' : '#0B0920'} />
      <path d="M32 82 C26 98 26 116 32 132" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* band pattern */}
      <path d="M22 100 C50 112 110 112 138 100" stroke={punya ? '#FFE9A8' : '#8A86F2'} strokeOpacity="0.55" strokeWidth="1.5" fill="none" strokeDasharray="2 4" />
      {/* flame / lotus mark */}
      {punya ? (
        <path d="M80 8c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="#FFB347" stroke="#C77F0A" strokeWidth="1" />
      ) : null}
    </svg>
  );
}
