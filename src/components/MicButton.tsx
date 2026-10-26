import { Icon } from './Icon';

export function MicButton({
  onClick, label, size = 'lg', active = false,
}: { onClick: () => void; label: string; size?: 'lg' | 'md'; active?: boolean }) {
  const dim = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`relative grid ${dim} place-items-center rounded-full bg-gradient-to-b from-[#FFC15A] to-saffron text-[#2A1A08] shadow-glow transition active:scale-95`}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-saffron/40 motion-reduce:hidden" />}
      <Icon name={active ? 'stop' : 'mic'} size={size === 'lg' ? 40 : 28} />
    </button>
  );
}
