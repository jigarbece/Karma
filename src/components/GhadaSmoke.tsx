/** Decorative smoke shared by the welcome illustration and today's ghada cards. */
export function GhadaSmoke({ kind, compact = false }: { kind: 'punya' | 'paap'; compact?: boolean }) {
  return (
    <span className={`ghada-smoke ghada-smoke--${kind}${compact ? ' ghada-smoke--compact' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="smoke-trail smoke-trail--shadow" d="M49 100C28 82 67 73 47 57S65 29 51 2" />
        <path className="smoke-trail smoke-trail--main" d="M48 100C31 83 69 72 49 56S67 28 54 4" />
        <path className="smoke-trail smoke-trail--side" d="M54 100C71 83 35 75 55 58S39 32 62 12" />
        <path className="smoke-trail smoke-trail--highlight" d="M47 98C39 83 59 75 43 61S53 37 47 21" />
      </svg>
    </span>
  );
}
