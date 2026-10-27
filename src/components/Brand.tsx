export function LotusMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD777" />
          <stop offset="1" stopColor="#E2992A" />
        </linearGradient>
      </defs>
      <g fill="url(#lm-g)" stroke="#B9791E" strokeWidth="1">
        <path d="M24 6c6 7 6 17 0 25-6-8-6-18 0-25z" />
        <path d="M8 14c8 1 14 6 16 17-9-1-15-7-16-17z" />
        <path d="M40 14c-8 1-14 6-16 17 9-1 15-7 16-17z" />
        <path d="M4 26c7 0 14 4 20 12-9 1-17-3-20-12z" opacity="0.9" />
        <path d="M44 26c-7 0-14 4-20 12 9 1 17-3 20-12z" opacity="0.9" />
      </g>
      <path d="M12 40c8 4 16 4 24 0" stroke="#B9791E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
