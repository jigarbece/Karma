/** Decorative sacred-geometry ornament. Purely visual: hidden from assistive tech. */
export function Mandala({ className = '', spin = true }: { className?: string; spin?: boolean }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  const inner = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" className={`${spin ? 'mandala-spin' : ''} ${className}`} fill="none" stroke="currentColor">
      <circle cx="200" cy="200" r="190" strokeWidth="0.8" strokeDasharray="2 7" />
      <circle cx="200" cy="200" r="150" strokeWidth="0.8" />
      <g strokeWidth="1">
        {petals.map((r) => (
          <path key={r} d="M200 40c24 30 24 70 0 100c-24-30-24-70 0-100z" transform={`rotate(${r} 200 200)`} />
        ))}
      </g>
      <g strokeWidth="1">
        {inner.map((r) => (
          <path key={r} d="M200 110c14 18 14 42 0 62c-14-20-14-44 0-62z" transform={`rotate(${r} 200 200)`} />
        ))}
      </g>
      <circle cx="200" cy="200" r="26" strokeWidth="1" />
      <circle cx="200" cy="200" r="8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Small lotus + gold hairline used as a section ornament. */
export function LotusDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-gold ${className}`} aria-hidden="true">
      <span className="gold-rule h-px flex-1" />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5c2.5 2.6 2.5 6.4 0 9-2.5-2.6-2.5-6.4 0-9zM3 10c3.4.2 6 2.6 7 6-3.4-.2-6-2.6-7-6zM21 10c-3.4.2-6 2.6-7 6 3.4-.2 6-2.6 7-6zM6 19c4 1.4 8 1.4 12 0" />
      </svg>
      <span className="gold-rule h-px flex-1" />
    </div>
  );
}
