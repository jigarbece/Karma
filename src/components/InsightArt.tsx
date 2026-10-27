/** Decorative sunrise over mountains with a seated figure, for the Daily Insight card. */
export function InsightArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="ia-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7C98A" />
          <stop offset="0.6" stopColor="#FFE7B8" />
          <stop offset="1" stopColor="#FFF4DA" />
        </linearGradient>
        <radialGradient id="ia-sun" cx="0.5" cy="0.62" r="0.4">
          <stop offset="0" stopColor="#FFF3C4" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#ia-sky)" />
      <circle cx="200" cy="118" r="90" fill="url(#ia-sun)" />
      <circle cx="200" cy="120" r="30" fill="#FFE9A8" />
      <path d="M0 150 L70 96 L120 130 L190 78 L260 132 L320 100 L400 146 V200 H0Z" fill="#C9A982" opacity="0.7" />
      <path d="M0 172 L80 128 L150 160 L230 116 L310 160 L400 128 V200 H0Z" fill="#8F7B5E" opacity="0.85" />
      <path d="M0 192 C100 178 300 178 400 192 V200 H0Z" fill="#5F5340" />
      {/* seated figure */}
      <g fill="#2B2216">
        <circle cx="200" cy="146" r="8" />
        <path d="M186 186 C188 164 192 158 200 156 C208 158 212 164 214 186 Z" />
        <path d="M178 188 C190 182 210 182 222 188 C214 192 186 192 178 188Z" />
      </g>
    </svg>
  );
}

/** Peaceful decorative sound bars either side of the mic. */
export function Waveform({ className = '', mirror = false }: { className?: string; mirror?: boolean }) {
  const hs = [10, 22, 14, 34, 20, 46, 28, 56, 36, 44, 24, 30, 16, 22, 10];
  const bars = mirror ? [...hs].reverse() : hs;
  return (
    <svg viewBox="0 0 150 64" aria-hidden="true" focusable="false" className={className}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 10 + 2} y={32 - h / 2} width="4" height={h} rx="2" fill="#F28C28" opacity={0.25 + (mirror ? 14 - i : i) * 0.05} />
      ))}
    </svg>
  );
}
