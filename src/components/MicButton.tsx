import { Icon } from './Icon';

/** Round saffron mic. Fixed 64px so it never stretches or overflows its row; the listening pulse stays inside it. */
export function MicButton({ onClick, label, active = false }: { onClick: () => void; label: string; active?: boolean }) {
  return (
    <span className="relative inline-grid h-16 w-16 shrink-0 place-items-center">
      {active && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-saffron/40 motion-reduce:hidden" />}
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className="relative grid h-16 w-16 place-items-center rounded-full text-[#2A1A08] shadow-glow transition active:scale-95"
        style={{ background: 'radial-gradient(circle at 35% 28%, #FFE2A0, #FFB347 55%, #F28C28)' }}
      >
        <Icon name={active ? 'stop' : 'mic'} size={28} />
      </button>
    </span>
  );
}
