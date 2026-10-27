/**
 * Decorative sunrise at a riverside temple: warm sky, trees, a chhatri, lotus blossoms and a peacock feather.
 * Purely illustrative, hidden from assistive tech. Replace with a licensed photo by adding /public/hero.jpg.
 */
export function HeroScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCE4B4" />
          <stop offset="0.55" stopColor="#FFF3DA" />
          <stop offset="1" stopColor="#F9DDAA" />
        </linearGradient>
        <radialGradient id="hs-sun" cx="0.75" cy="0.32" r="0.55">
          <stop offset="0" stopColor="#FFD98A" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#FFE7B0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE7B0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8C6A6" />
          <stop offset="1" stopColor="#B49C77" />
        </linearGradient>
        <linearGradient id="hs-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hs-eye" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1E5FA8" />
          <stop offset="0.5" stopColor="#1B8A8F" />
          <stop offset="1" stopColor="#D7A83A" />
        </radialGradient>
      </defs>

      <rect width="1200" height="460" fill="url(#hs-sky)" />
      <rect width="1200" height="460" fill="url(#hs-sun)" />

      {/* soft rays */}
      <g>
        <polygon points="880,0 960,0 760,460 560,460" fill="url(#hs-ray)" />
        <polygon points="990,0 1030,0 960,460 860,460" fill="url(#hs-ray)" opacity="0.7" />
      </g>

      {/* far hills + haze */}
      <path d="M0 300 C140 250 260 270 380 285 C520 300 600 240 760 262 C900 282 1040 250 1200 276 V460 H0Z" fill="#CFC9A0" opacity="0.45" />
      <path d="M0 340 C160 300 300 330 460 325 C640 318 760 290 940 312 C1060 326 1140 310 1200 316 V460 H0Z" fill="#B7BE8E" opacity="0.5" />

      {/* chhatri (temple pavilion) */}
      <g fill="#8F7F66" opacity="0.8">
        <path d="M980 220 C1010 170 1070 170 1100 220 Z" />
        <rect x="1037" y="150" width="6" height="26" />
        <circle cx="1040" cy="146" r="5" />
        <rect x="984" y="222" width="112" height="8" />
        {[992, 1020, 1048, 1076].map((x) => (
          <rect key={x} x={x} y="230" width="9" height="104" />
        ))}
        <rect x="976" y="334" width="128" height="10" />
      </g>
      <g fill="#8F7F66" opacity="0.5">
        <path d="M760 300 C780 268 820 268 840 300 Z" />
        <rect x="766" y="300" width="68" height="40" />
      </g>

      {/* foliage clusters */}
      <g>
        <g fill="#7C9A5A" opacity="0.85">
          <circle cx="40" cy="30" r="70" /><circle cx="130" cy="10" r="60" /><circle cx="220" cy="40" r="46" />
          <circle cx="10" cy="120" r="50" />
        </g>
        <g fill="#A9C27C" opacity="0.7">
          <circle cx="80" cy="60" r="44" /><circle cx="170" cy="50" r="36" /><circle cx="30" cy="90" r="30" />
        </g>
        <g fill="#6E8F52" opacity="0.8">
          <circle cx="1180" cy="40" r="80" /><circle cx="1110" cy="10" r="56" /><circle cx="1190" cy="140" r="52" />
        </g>
        <g fill="#B6CE86" opacity="0.65">
          <circle cx="1130" cy="50" r="34" /><circle cx="1170" cy="95" r="30" />
        </g>
      </g>

      {/* stone ghat */}
      <rect x="0" y="372" width="1200" height="88" fill="url(#hs-stone)" />
      <g stroke="#9C8660" strokeWidth="1.2" opacity="0.5">
        <path d="M0 400H1200M0 430H1200" />
        {[90, 260, 430, 600, 770, 940, 1110].map((x) => (
          <path key={x} d={`M${x} 372V400M${x + 85} 400V430M${x} 430V460`} />
        ))}
      </g>

      {/* flute */}
      <g>
        <line x1="760" y1="236" x2="1010" y2="168" stroke="#B9791E" strokeWidth="7" strokeLinecap="round" />
        <line x1="760" y1="236" x2="1010" y2="168" stroke="#F4C45E" strokeWidth="3" strokeLinecap="round" />
        {[800, 850, 900, 950].map((x, i) => (
          <circle key={x} cx={x} cy={225 - i * 17.5} r="2.6" fill="#8A5A12" />
        ))}
      </g>

      {/* peacock feather */}
      <g transform="translate(1085 70) rotate(18)">
        <path d="M0 150 C-6 90 6 40 0 -50" stroke="#2F6B52" strokeWidth="3" fill="none" strokeLinecap="round" />
        {Array.from({ length: 14 }, (_, i) => {
          const y = 110 - i * 12;
          return (
            <g key={i} stroke="#4C8A5E" strokeWidth="1.4" opacity="0.75">
              <path d={`M0 ${y} l-22 -${8 + (i % 3)}`} />
              <path d={`M0 ${y} l22 -${8 + (i % 3)}`} />
            </g>
          );
        })}
        <ellipse cx="0" cy="-46" rx="25" ry="34" fill="#3F8B66" opacity="0.55" />
        <ellipse cx="0" cy="-46" rx="17" ry="25" fill="url(#hs-eye)" />
        <ellipse cx="0" cy="-48" rx="7" ry="11" fill="#173A6B" />
      </g>

      {/* lotus blossoms in the foreground */}
      <g>
        {[
          [70, 428, 1],
          [170, 446, 0.8],
          [280, 436, 0.7],
        ].map(([x, y, s]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
            {[-48, -24, 0, 24, 48].map((r) => (
              <path key={r} d="M0 0 C-14 -18 -10 -42 0 -54 C10 -42 14 -18 0 0Z" fill="#FFFDF7" stroke="#F0D6C8" strokeWidth="1" transform={`rotate(${r})`} />
            ))}
            <circle cx="0" cy="-6" r="7" fill="#F2B84B" />
          </g>
        ))}
        <path d="M30 460 C60 436 90 440 120 460Z" fill="#6E8F52" opacity="0.8" />
      </g>
    </svg>
  );
}
