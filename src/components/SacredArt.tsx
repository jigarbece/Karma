/** Decorative sacred imagery (hidden from assistive tech): an Om chakra and a peacock feather. */

export function OmChakra({ className = '' }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 320 320" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="oc-core" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.6" stopColor="#F2B233" />
          <stop offset="1" stopColor="#B9791E" />
        </radialGradient>
        <linearGradient id="oc-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE38A" />
          <stop offset="0.5" stopColor="#C77F0A" />
          <stop offset="1" stopColor="#FFE38A" />
        </linearGradient>
      </defs>
      <g className="mandala-spin" style={{ transformOrigin: '160px 160px' }}>
        <circle cx="160" cy="160" r="150" fill="none" stroke="url(#oc-ring)" strokeWidth="3" />
        <circle cx="160" cy="160" r="142" fill="none" stroke="#C77F0A" strokeWidth="1" strokeDasharray="2 6" />
        {spokes.map((r) => (
          <path key={r} d="M160 18 L166 52 L160 62 L154 52 Z" fill="url(#oc-ring)" opacity="0.9" transform={`rotate(${r} 160 160)`} />
        ))}
      </g>
      <circle cx="160" cy="160" r="104" fill="none" stroke="url(#oc-ring)" strokeWidth="2" />
      {petals.map((r) => (
        <path key={r} d="M160 62 C178 88 178 112 160 134 C142 112 142 88 160 62Z" fill="none" stroke="url(#oc-ring)" strokeWidth="1.6" transform={`rotate(${r} 160 160)`} />
      ))}
      <circle cx="160" cy="160" r="52" fill="url(#oc-core)" stroke="#8A5A12" strokeWidth="2" />
      <text x="160" y="186" textAnchor="middle" fontSize="70" fontWeight="700" fill="#5B3A0C" fontFamily="'Noto Sans Devanagari','Tiro Devanagari Hindi',serif">ॐ</text>
    </svg>
  );
}

export function PeacockFeather({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 300" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="pf-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#1E5FA8" />
          <stop offset="0.55" stopColor="#1B8A8F" />
          <stop offset="1" stopColor="#D7A83A" />
        </radialGradient>
      </defs>
      <path d="M60 290 C54 210 66 120 60 30" stroke="#2F6B52" strokeWidth="3" fill="none" strokeLinecap="round" />
      {Array.from({ length: 22 }, (_, i) => {
        const y = 250 - i * 9.5;
        return (
          <g key={i} stroke="#4C8A5E" strokeWidth="1.3" opacity="0.75">
            <path d={`M60 ${y} l-30 -${10 + (i % 4)}`} />
            <path d={`M60 ${y} l30 -${10 + (i % 4)}`} />
          </g>
        );
      })}
      <ellipse cx="60" cy="68" rx="34" ry="48" fill="#3F8B66" opacity="0.55" />
      <ellipse cx="60" cy="68" rx="24" ry="36" fill="url(#pf-eye)" />
      <ellipse cx="60" cy="64" rx="10" ry="16" fill="#173A6B" />
    </svg>
  );
}
